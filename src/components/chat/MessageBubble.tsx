// MessageBubble.tsx - Reusable message bubble component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/Message';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
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

  return (
    <View
      style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}
    >
      <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && (
            <Text style={styles.statusIcon}>
              {getStatusIcon(message.status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ownMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statusIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
});
