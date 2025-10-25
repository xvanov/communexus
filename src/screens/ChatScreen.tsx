// ChatScreen.tsx - Individual chat interface with message bubbles and input
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { useInAppNotifications } from '../hooks/useInAppNotifications';
import { Message } from '../types/Message';
import { Thread } from '../types/Thread';
import { sendMessage, createOptimisticMessage } from '../services/messaging';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { SummaryModal } from '../components/ai/SummaryModal';
import { ActionItemModal } from '../components/ai/ActionItemModal';
import { ProactiveSuggestions } from '../components/ai/ProactiveSuggestions';
import { AIActionItem, ProactiveSuggestion } from '../types/AIFeatures';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

export default function ChatScreen({ route, navigation }: any) {
  const { threadId, thread, contact } = route.params as {
    threadId: string;
    thread?: Thread;
    contact?: any;
  };
  const { messages, loading, error } = useMessages(threadId);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showActionItems, setShowActionItems] = useState(false);
  const [actionItems, setActionItems] = useState<AIActionItem[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Don't show notifications for messages in this thread (user is viewing it)
  useInAppNotifications(threadId);

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

  const extractActionItems = async () => {
    console.log('📋 Extract Action Items called');
    console.log('📋 Messages count:', messages.length);

    if (messages.length === 0) {
      console.log('📋 No messages to process');
      return;
    }

    try {
      setLoadingActions(true);
      console.log('📋 Starting action item extraction...');

      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiActionExtraction'
        : 'https://us-central1-communexus.cloudfunctions.net/aiActionExtraction';

      console.log('📋 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            threadId,
            messages: messages.map(m => ({
              text: m.text,
              sender: m.senderName,
            })),
          },
        }),
      });

      console.log('📋 Response status:', response.status);
      const result = await response.json();
      console.log('✅ Action items result:', result);

      const data = result.result || result.data;
      if (data.success && data.actionItems) {
        console.log('📋 Found action items:', data.actionItems.length);
        setActionItems(data.actionItems);
        setShowActionItems(true);
      } else {
        console.error('❌ No action items found:', data.error);
      }
    } catch (err: any) {
      console.error('❌ Error extracting action items:', err);
    } finally {
      setLoadingActions(false);
      console.log('📋 Action extraction complete');
    }
  };

  const fetchProactiveSuggestions = async () => {
    if (messages.length === 0) {
      return;
    }

    try {
      setLoadingSuggestions(true);
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiProactiveAgent'
        : 'https://us-central1-communexus.cloudfunctions.net/aiProactiveAgent';

      // Get last 10 messages for context
      const recentMessages = messages.slice(-10);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            threadId: threadId, // FIXED: Added threadId
            recentMessages: recentMessages.map(m => ({
              text: m.text,
              sender: m.senderName,
            })),
            userContext: `User ${user?.displayName || 'unknown'} in thread ${threadId}`,
            threadContext: `Conversation with ${safeThread.participantDetails.length} participants`,
          },
        }),
      });

      const result = await response.json();
      console.log('✅ Proactive suggestions result:', result);

      const data = result.result || result.data;
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Auto-fetch suggestions when messages change (with debounce)
  useEffect(() => {
    if (messages.length >= 3) {
      const timer = setTimeout(() => {
        fetchProactiveSuggestions();
      }, 5000); // Wait 5 seconds after last message

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for useEffect
  }, [messages.length]);

  useEffect(() => {
    navigation.setOptions({
      title: displayName,
      headerTitleStyle: {
        fontSize: 17,
        fontWeight: '600',
        maxWidth: '60%', // Limit title width to prevent overlap with buttons
      },
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => {
              console.log('📋 Action button pressed!');
              extractActionItems();
            }}
            style={styles.actionButton}
            testID="action-items-button"
            disabled={loadingActions}
          >
            {loadingActions ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.actionButtonText}>📋</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAISummary(true)}
            style={styles.aiButton}
            testID="ai-summary-button"
          >
            <Text style={styles.aiButtonText}>✨</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [displayName, navigation, loadingActions, messages.length]);

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
      console.error('Failed to send message:', error);
      throw error; // Let ChatInput handle the error display
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        isGroup={safeThread.isGroup}
      />
    );
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
        testID="message-list"
      />

      <ChatInput onSendMessage={handleSendMessage} disabled={!user} />

      {/* Proactive AI Suggestions - Show at bottom if available */}
      {suggestions.length > 0 && !loadingSuggestions && (
        <ProactiveSuggestions
          suggestions={suggestions}
          onDismiss={suggestion => {
            // Remove the dismissed suggestion
            setSuggestions(suggestions.filter(s => s !== suggestion));
          }}
        />
      )}

      <SummaryModal
        visible={showAISummary}
        onClose={() => setShowAISummary(false)}
        threadId={threadId}
        messages={messages}
      />

      <ActionItemModal
        visible={showActionItems}
        onClose={() => setShowActionItems(false)}
        actionItems={actionItems}
        onActionItemPress={item => {
          console.log('Action item pressed:', item);
          // Could navigate to message or mark complete
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    height: 36,
    justifyContent: 'center',
    marginRight: Spacing.sm,
    width: 36,
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  aiButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.round,
    height: 36,
    justifyContent: 'center',
    marginRight: Spacing.sm,
    width: 36,
  },
  aiButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  centerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerButtons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  messagesContent: {
    paddingVertical: Spacing.md,
  },
  messagesList: {
    flex: 1,
  },
});
