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
          <View style={styles.spacer} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
    flex: 1,
  },
  threadTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  threadPreview: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
