import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/utils/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Users, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';

export default function NewChatScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Search for users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const data = await response.json();
      return data.users || [];
    },
    enabled: searchQuery.length >= 2,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (participantId) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          participant_ids: [participantId],
          conversation_type: 'direct'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.replace(`/chat/${data.conversation_id}`);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to start conversation');
    },
  });

  const handleStartChat = useCallback((user) => {
    createConversationMutation.mutate(user.id);
  }, [createConversationMutation]);

  const formatLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return 'Last seen a while ago';
    
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 5) {
      return 'Active now';
    } else if (diffInMinutes < 60) {
      return `Last seen ${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `Last seen ${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `Last seen ${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const renderUserItem = ({ item }) => {
    const displayName = item.display_name || item.name || item.email;
    const isOnline = item.status === 'online';
    
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
        onPress={() => handleStartChat(item)}
        disabled={createConversationMutation.isLoading}
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
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
          ) : (
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#6B7280' 
            }}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
          
          {/* Online indicator */}
          {isOnline && (
            <View style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#22C55E',
              borderWidth: 2,
              borderColor: 'white',
            }} />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: '#111827',
            marginBottom: 2,
          }}>
            {displayName}
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: isOnline ? '#22C55E' : '#6B7280',
          }}>
            {isOnline ? 'Online' : formatLastSeen(item.last_seen)}
          </Text>
        </View>

        {/* Message icon */}
        <MessageSquare size={20} color="#6B7280" />
      </TouchableOpacity>
    );
  };

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
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#111827',
          }}>
            New Chat
          </Text>
        </View>
        
        {/* Search Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Search size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for people by name or email..."
            style={{
              flex: 1,
              fontSize: 16,
              color: '#111827',
            }}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Results */}
      <View style={{ flex: 1 }}>
        {searchQuery.length < 2 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
          }}>
            <Users size={64} color="#D1D5DB" />
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#9CA3AF',
              marginTop: 16,
              textAlign: 'center',
            }}>
              Find People to Chat With
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginTop: 8,
              textAlign: 'center',
            }}>
              Search by name or email to start a conversation
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              !isLoading && (
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: 100,
                  paddingHorizontal: 40,
                }}>
                  <Search size={48} color="#D1D5DB" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#9CA3AF',
                    marginTop: 16,
                    textAlign: 'center',
                  }}>
                    No users found
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginTop: 8,
                    textAlign: 'center',
                  }}>
                    Try a different search term
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}