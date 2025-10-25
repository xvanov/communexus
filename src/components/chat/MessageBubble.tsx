// MessageBubble.tsx - Reusable message bubble component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/Message';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityLevel } from '../../types/AIFeatures';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGroup?: boolean; // Add isGroup to show sender names
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isGroup = false,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  // Get priority from message metadata (if AI has analyzed it)
  const priority = (message as any).priority as PriorityLevel | undefined;

  return (
    <View
      style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}
    >
      {/* Show sender name for group chats (only for other people's messages) */}
      {isGroup && !isOwn && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      <View
        style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}
        testID="message-bubble"
      >
        {/* Priority Badge - show at top for high priority messages */}
        {priority && priority !== 'low' && (
          <View style={styles.priorityContainer}>
            <PriorityBadge priority={priority} size="small" />
          </View>
        )}
        <Text
          style={[styles.messageText, isOwn && styles.ownMessageText]}
          testID="message-text"
        >
          {message.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[styles.messageTime, isOwn && styles.ownMessageTime]}
            testID="message-timestamp"
          >
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && (
            <Text style={styles.statusIcon} testID="message-status">
              {getStatusIcon(message.status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  messageFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  ownMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  priorityContainer: {
    marginBottom: 6,
  },
  senderName: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  statusIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
});
