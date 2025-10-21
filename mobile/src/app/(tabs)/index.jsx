import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/utils/auth/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Plus, MessageCircle, Search, MoreVertical } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations
  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      return data.conversations || [];
    },
    enabled: !!auth,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.conversation_type === 'group') {
      return conversation.title || 'Group Chat';
    }
    const participants = conversation.participants || [];
    if (participants.length > 0) {
      return participants[0].display_name || participants[0].name || 'Unknown User';
    }
    return 'Direct Message';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.conversation_type === 'direct') {
      const participants = conversation.participants || [];
      if (participants.length > 0 && participants[0].avatar_url) {
        return participants[0].avatar_url;
      }
    }
    return null;
  };

  const renderConversationItem = ({ item }) => {
    const title = getConversationTitle(item);
    const avatarUrl = getConversationAvatar(item);
    const hasUnread = item.unread_count > 0;
    
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        {/* Avatar */}
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#E5E7EB',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
          ) : (
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#6B7280' 
            }}>
              {title.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 4 
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: hasUnread ? '600' : '500',
              color: '#111827',
              flex: 1,
            }} numberOfLines={1}>
              {title}
            </Text>
            
            {item.last_message_time && (
              <Text style={{
                fontSize: 12,
                color: hasUnread ? '#007AFF' : '#6B7280',
                fontWeight: hasUnread ? '600' : '400',
              }}>
                {formatTime(item.last_message_time)}
              </Text>
            )}
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              flex: 1,
            }} numberOfLines={1}>
              {item.last_message_content || 'No messages yet'}
            </Text>
            
            {hasUnread && (
              <View style={{
                backgroundColor: '#007AFF',
                borderRadius: 12,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
                marginLeft: 8,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: 'white',
                  fontWeight: '600',
                }}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleNewChat = () => {
    router.push('/new-chat');
  };

  if (error) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: insets.top,
        backgroundColor: '#F9FAFB',
      }}>
        <StatusBar style="dark" />
        <Text style={{ fontSize: 16, color: '#EF4444', textAlign: 'center' }}>
          Failed to load conversations
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: '#007AFF',
            borderRadius: 8,
          }}
          onPress={() => refetch()}
        >
          <Text style={{ color: 'white', fontWeight: '500' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#F9FAFB',
      paddingTop: insets.top,
    }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#111827',
          }}>
            Chats
          </Text>
          
          <TouchableOpacity
            onPress={handleNewChat}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#007AFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 100,
          }}>
            <MessageCircle size={64} color="#D1D5DB" />
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#9CA3AF',
              marginTop: 16,
              textAlign: 'center',
            }}>
              No conversations yet
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginTop: 8,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}>
              Start a new conversation to begin messaging
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 24,
                paddingVertical: 12,
                paddingHorizontal: 24,
                backgroundColor: '#007AFF',
                borderRadius: 8,
              }}
              onPress={handleNewChat}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
              }}>
                Start Chatting
              </Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}