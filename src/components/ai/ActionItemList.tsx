import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { AIActionItem, PriorityLevel } from '../../types/AIFeatures';
import { PriorityBadge } from '../common/PriorityBadge';

interface ActionItemListProps {
  actionItems: AIActionItem[];
  onActionItemPress?: (actionItem: AIActionItem) => void;
}

export const ActionItemList: React.FC<ActionItemListProps> = ({
  actionItems,
  onActionItemPress,
}) => {
  const renderActionItem = ({ item }: { item: AIActionItem }) => (
    <TouchableOpacity
      style={styles.actionItemContainer}
      onPress={() => onActionItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.actionItemHeader}>
        <Text style={styles.actionItemText}>{item.task}</Text>
        <PriorityBadge priority={item.priority} size="small" />
      </View>
      {item.assignedTo && (
        <Text style={styles.assigneeText}>👤 {item.assignedTo}</Text>
      )}
      {item.status && (
        <Text style={styles.statusText}>
          {item.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
        </Text>
      )}
    </TouchableOpacity>
  );

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
  statusText: {
    color: '#666666',
    fontSize: 14,
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
