import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { AIFeatures } from '../../types/AIFeatures';

interface ActionItemListProps {
  actionItems: AIFeatures.ActionItem[];
  onActionItemPress?: (actionItem: AIFeatures.ActionItem) => void;
}

export const ActionItemList: React.FC<ActionItemListProps> = ({
  actionItems,
  onActionItemPress
}) => {
  const renderActionItem = ({ item }: { item: AIFeatures.ActionItem }) => (
    <TouchableOpacity
      style={styles.actionItemContainer}
      onPress={() => onActionItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.actionItemHeader}>
        <Text style={styles.actionItemText}>{item.text}</Text>
        <View style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(item.priority) }
        ]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      {item.assignee && (
        <Text style={styles.assigneeText}>Assigned to: {item.assignee}</Text>
      )}
      {item.dueDate && (
        <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
      )}
    </TouchableOpacity>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  if (actionItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No action items found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Action Items ({actionItems.length})</Text>
      <FlatList
        data={actionItems}
        renderItem={renderActionItem}
        keyExtractor={(item, index) => `${item.id || index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 16,
  },
  actionItemContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  actionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionItemText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  assigneeText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
