// ThreadItem.tsx - Reusable thread list item component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Thread } from '../../types/Thread';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';

interface ThreadItemProps {
  thread: Thread;
  onPress: (thread: Thread) => void;
  currentUserId: string;
}

export const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  onPress,
  currentUserId,
}) => {
  const unreadCount = thread.unreadCount[currentUserId] || 0;
  const otherParticipants = thread.participantDetails.filter(
    p => p.id !== currentUserId
  );
  const displayName = thread.isGroup
    ? thread.groupName || `${otherParticipants.length + 1} participants`
    : otherParticipants[0]?.name || 'Unknown';

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  // Show preview of last message
  const lastMessagePreview = thread.lastMessage?.text 
    ? `${thread.lastMessage.senderName}: ${thread.lastMessage.text}`
    : 'No messages yet';

  return (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => onPress(thread)}
      activeOpacity={0.7}
      testID="thread-item"
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text 
            style={[
              styles.threadName,
              unreadCount > 0 && styles.threadNameUnread
            ]} 
            numberOfLines={1}
            testID="thread-name"
          >
            {displayName}
          </Text>
          <Text style={[
            styles.threadTime,
            unreadCount > 0 && styles.threadTimeUnread
          ]}>
            {thread.lastMessage
              ? formatTime(thread.lastMessage.timestamp)
              : ''}
          </Text>
        </View>
        <View style={styles.threadPreview}>
          <Text 
            style={[
              styles.threadMessage,
              unreadCount > 0 && styles.threadMessageUnread
            ]}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge} testID="unread-badge">
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.round,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  threadItem: {
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  threadMessage: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginRight: Spacing.sm,
  },
  threadMessageUnread: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  threadName: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginRight: Spacing.sm,
  },
  threadNameUnread: {
    fontWeight: '600',
  },
  threadPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  threadTime: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  threadTimeUnread: {
    color: Colors.primary,
    fontWeight: '600',
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
