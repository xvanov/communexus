import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/utils/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Send, Image as ImageIcon, Camera, Paperclip } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUpload } from '@/utils/useUpload';
import * as ImagePicker from 'expo-image-picker';
import { Animated } from 'react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const conversationId = parseInt(id);
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [upload] = useUpload();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  
  // Keyboard handling for iOS
  const paddingAnimation = useRef(new Animated.Value(insets.bottom + 12)).current;
  
  const animateTo = (value) => {
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputFocus = () => {
    if (Platform.OS === 'web') return;
    animateTo(12); // Just padding, no insets when focused
  };

  const handleInputBlur = () => {
    if (Platform.OS === 'web') return;
    animateTo(insets.bottom + 12);
  };

  // Fetch messages
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!conversationId && !!auth,
    refetchInterval: 3000, // Poll for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, message_type = 'text', media_url, media_type }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          message_type, 
          media_url, 
          media_type,
          client_id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onMutate: async ({ content, message_type, media_url }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      // Optimistically update to the new value
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        content,
        message_type: message_type || 'text',
        media_url,
        sender_id: auth.user.id,
        sender_name: auth.user.name,
        created_at: new Date().toISOString(),
        delivery_status: 'sending'
      };

      queryClient.setQueryData(['messages', conversationId], (old) => 
        [...(old || []), optimisticMessage]
      );

      return { previousMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      Alert.alert('Error', 'Failed to send message');
    },
  });

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({ content: message.trim() });
    setMessage('');
  }, [message, sendMessageMutation]);

  const handleImagePicker = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Upload the image
        const uploadResult = await upload({ 
          reactNativeAsset: {
            uri: asset.uri,
            name: asset.fileName || 'image.jpg',
            mimeType: asset.type || 'image/jpeg'
          }
        });
        
        if (uploadResult.error) {
          Alert.alert('Upload Error', uploadResult.error);
          return;
        }

        // Send as image message
        sendMessageMutation.mutate({ 
          content: '',
          message_type: 'image',
          media_url: uploadResult.url,
          media_type: asset.type || 'image/jpeg'
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  }, [upload, sendMessageMutation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item, index }) => {
    const isOwnMessage = item.sender_id === auth?.user?.id;
    const showSender = !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== item.sender_id);
    const isImage = item.message_type === 'image';
    
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 2,
        marginVertical: 2,
      }}>
        {!isOwnMessage && (
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
            alignSelf: 'flex-end',
            opacity: showSender ? 1 : 0,
          }}>
            {item.sender_avatar_url ? (
              <Image
                source={{ uri: item.sender_avatar_url }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '600', 
                color: '#6B7280' 
              }}>
                {(item.sender_display_name || item.sender_name || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}
        
        <View style={{
          maxWidth: '75%',
        }}>
          {showSender && (
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 4,
              marginLeft: 12,
            }}>
              {item.sender_display_name || item.sender_name}
            </Text>
          )}
          
          <View style={{
            backgroundColor: isOwnMessage ? '#007AFF' : 'white',
            borderRadius: 18,
            paddingVertical: isImage ? 4 : 10,
            paddingHorizontal: isImage ? 4 : 14,
            borderWidth: isOwnMessage ? 0 : 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            {isImage ? (
              <Image
                source={{ uri: item.media_url }}
                style={{ 
                  width: 200, 
                  height: 150, 
                  borderRadius: 14 
                }}
                contentFit="cover"
              />
            ) : (
              <Text style={{
                fontSize: 16,
                color: isOwnMessage ? 'white' : '#111827',
                lineHeight: 20,
              }}>
                {item.content}
              </Text>
            )}
          </View>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            marginTop: 4,
            paddingHorizontal: 4,
          }}>
            <Text style={{
              fontSize: 11,
              color: '#9CA3AF',
            }}>
              {formatMessageTime(item.created_at)}
            </Text>
            
            {isOwnMessage && item.delivery_status && (
              <Text style={{
                fontSize: 11,
                color: item.delivery_status === 'read' ? '#007AFF' : '#9CA3AF',
                marginLeft: 4,
              }}>
                {item.delivery_status === 'read' ? '✓✓' : 
                 item.delivery_status === 'delivered' ? '✓' : 
                 item.delivery_status === 'sending' ? '...' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!conversationId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid conversation</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAFB', paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
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
        
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#E5E7EB',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280' }}>
            U
          </Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#111827',
          }}>
            Chat
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#6B7280',
          }}>
            {isTyping ? 'typing...' : 'online'}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1, backgroundColor: '#F9FAFB' }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 100,
          }}>
            <Text style={{
              fontSize: 16,
              color: '#9CA3AF',
              textAlign: 'center',
            }}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <Animated.View style={{
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: paddingAnimation,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
        }}>
          <TouchableOpacity
            onPress={handleImagePicker}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <ImageIcon size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            maxHeight: 100,
          }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Type a message..."
              style={{
                fontSize: 16,
                color: '#111827',
                minHeight: 20,
              }}
              placeholderTextColor="#9CA3AF"
              multiline
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
          </View>
          
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isLoading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: message.trim() ? '#007AFF' : '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 12,
            }}
          >
            <Send 
              size={18} 
              color={message.trim() ? 'white' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}