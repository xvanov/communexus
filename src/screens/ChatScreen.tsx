// ChatScreen.tsx - Individual chat interface with message bubbles and input
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../types/Message';
import { Thread } from '../types/Thread';
import { sendMessage, createOptimisticMessage } from '../services/messaging';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';

export default function ChatScreen({ route, navigation }: any) {
  const { threadId, thread, contact } = route.params as {
    threadId: string;
    thread?: Thread;
    contact?: any;
  };
  const { messages, loading, error } = useMessages(threadId);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  // Debug logging
  // eslint-disable-next-line no-console
  console.log('ChatScreen params:', { threadId, thread, contact });

  // Handle case where thread is undefined (navigating from contacts)
  const safeThread = thread || {
    id: threadId,
    participants: [user?.uid || '', contact?.id || ''],
    participantDetails: [
      {
        id: user?.uid || '',
        name: user?.displayName || user?.email || 'You',
        ...(user?.photoURL && { photoUrl: user.photoURL }),
      },
      {
        id: contact?.id || '',
        name: contact?.name || contact?.email || 'Unknown',
        ...(contact?.photoUrl && { photoUrl: contact.photoUrl }),
      },
    ],
    isGroup: false,
    groupName: null,
    groupPhotoUrl: null,
    lastMessage: {
      text: '',
      senderId: '',
      senderName: '',
      timestamp: new Date(),
    },
    unreadCount: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherParticipants = safeThread.participantDetails.filter(
    p => p.id !== user?.uid
  );
  const displayName = safeThread.isGroup
    ? safeThread.groupName || `${otherParticipants.length + 1} participants`
    : otherParticipants[0]?.name || 'Unknown';

  useEffect(() => {
    navigation.setOptions({
      title: displayName,
    });
  }, [displayName, navigation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;

    try {
      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(
        threadId,
        user.uid,
        user.displayName || user.email || 'You',
        text,
        user.photoURL ?? undefined
      );

      // Send the actual message
      await sendMessage(optimisticMessage);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);
      throw error; // Let ChatInput handle the error display
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;
    return <MessageBubble message={item} isOwn={isOwn} />;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading messages</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please sign in to view messages</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <ChatInput onSendMessage={handleSendMessage} disabled={!user} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});
