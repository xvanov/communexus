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
    <TouchableOpacity style={styles.threadItem} onPress={() => onPress(thread)}>
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName}>{displayName}</Text>
          <Text style={styles.threadTime}>
            {formatTime(thread.lastMessage.timestamp)}
          </Text>
        </View>
        <View style={styles.threadPreview}>
          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {thread.lastMessage.text || 'No messages yet'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
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
  threadItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  threadTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  threadPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  unreadMessage: {
    color: '#000000',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
