// ThreadItem.tsx - Reusable thread list item component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Thread } from '../../types/Thread';

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

  return (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => onPress(thread)}
      testID="thread-item"
    >
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName} testID="thread-name">
            {displayName}
          </Text>
          <Text style={styles.threadTime}>
            {formatTime(thread.lastMessage.timestamp)}
          </Text>
        </View>
        <View style={styles.threadPreview}>
          <View style={styles.spacer} />
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
  spacer: {
    flex: 1,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  threadItem: {
    backgroundColor: '#000000',
    borderBottomColor: '#1C1C1E',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  threadName: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  threadPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  threadTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
