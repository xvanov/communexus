// MessageBubble.tsx - Reusable message bubble component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/Message';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityLevel } from '../../types/AIFeatures';
import { ChannelIcon } from '../common/ChannelIcon';
import { DirectionIndicator } from '../common/DirectionIndicator';
import { Colors, Spacing, BorderRadius, Shadows } from '../../utils/theme';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGroup?: boolean;
  organizationId?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isGroup = false,
  organizationId,
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

  const priority = (message as any).priority as PriorityLevel | undefined;

  // Show channel indicators if message has channel information
  const showChannelIndicators = message.channel && (message.senderIdentifier || message.recipientIdentifier);

  return (
    <View
      style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}
    >
      {/* Show sender name for group chats (only for other people's messages) */}
      {isGroup && !isOwn && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      {/* Channel indicators - show above message bubble */}
      {showChannelIndicators && (
        <View style={styles.channelIndicatorContainer}>
          <ChannelIcon channel={message.channel} size="small" />
          {message.direction && message.senderIdentifier && (
            <DirectionIndicator
              direction={message.direction}
              channel={message.channel}
              identifier={message.direction === 'incoming' ? message.senderIdentifier : message.recipientIdentifier || ''}
              organizationId={organizationId}
              size="small"
            />
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
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
    borderRadius: 8,
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadows.small,
  },
  messageContainer: {
    alignItems: 'flex-start',
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
  },
  messageFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: Spacing.sm,
    marginTop: 4,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  otherMessageBubble: {
    backgroundColor: Colors.bubbleOther,
    borderBottomLeftRadius: 2,
  },
  ownMessageBubble: {
    backgroundColor: Colors.bubbleOwn,
    borderBottomRightRadius: 2,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  ownMessageText: {
    color: Colors.textPrimary,
  },
  ownMessageTime: {
    color: Colors.textTertiary,
    opacity: 0.9,
  },
  priorityContainer: {
    marginBottom: 6,
  },
  senderName: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: Spacing.xs,
  },
  statusIcon: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.9,
  },
  channelIndicatorContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
