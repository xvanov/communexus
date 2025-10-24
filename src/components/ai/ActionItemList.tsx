import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { AIFeatures } from '../../types/AIFeatures';

interface ActionItemListProps {
  actionItems: AIFeatures.ActionItem[];
  onActionItemPress?: (actionItem: AIFeatures.ActionItem) => void;
}

export const ActionItemList: React.FC<ActionItemListProps> = ({
  actionItems,
  onActionItemPress,
}) => {
  const renderActionItem = ({ item }: { item: AIFeatures.ActionItem }) => (
    <TouchableOpacity
      style={styles.actionItemContainer}
      onPress={() => onActionItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.actionItemHeader}>
        <Text style={styles.actionItemText}>{item.text}</Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
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
  actionItemContainer: {
    backgroundColor: '#F2F2F7',
    borderLeftColor: '#007AFF',
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  actionItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionItemText: {
    color: '#000000',
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  assigneeText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 4,
  },
  container: {
    flex: 1,
  },
  dueDateText: {
    color: '#666666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  priorityBadge: {
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
