import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { AIActionItem, PriorityLevel } from '../../types/AIFeatures';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  updateActionItemStatus,
  filterActionItemsByStatus,
} from '../../services/actionItems';
import { useAuth } from '../../hooks/useAuth';

type FilterStatus = 'all' | 'pending' | 'completed';

interface ActionItemListProps {
  actionItems: AIActionItem[];
  threadId: string;
  onActionItemPress?: (actionItem: AIActionItem) => void;
  onActionItemUpdate?: (actionItem: AIActionItem) => void;
}

export const ActionItemList: React.FC<ActionItemListProps> = ({
  actionItems,
  threadId,
  onActionItemPress,
  onActionItemUpdate,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Filter and search action items
  const filteredItems = useMemo(() => {
    let filtered = filterActionItemsByStatus(actionItems, filterStatus);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const taskMatch = item.task.toLowerCase().includes(query);
        const textMatch = item.text?.toLowerCase().includes(query);
        const assignedMatch = item.assignedTo?.toLowerCase().includes(query);
        return taskMatch || textMatch || assignedMatch;
      });
    }

    // Sort: completed items last, then by priority (high -> medium -> low)
    const priorityOrder: Record<PriorityLevel, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return filtered.sort((a, b) => {
      // Completed items go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      // Within same status, sort by priority
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [actionItems, filterStatus, searchQuery]);

  const handleToggleComplete = async (item: AIActionItem) => {
    if (updatingIds.has(item.id)) return;

    const newStatus = item.status === 'completed' ? 'pending' : 'completed';

    try {
      setUpdatingIds(prev => new Set(prev).add(item.id));

      await updateActionItemStatus(item.id, newStatus, user?.uid);

      // Create updated item with proper handling of optional properties
      const { completedAt: _, completedBy: __, ...restItem } = item;
      const updatedItem: AIActionItem = {
        ...restItem,
        status: newStatus,
        ...(newStatus === 'completed'
          ? {
              completedAt: new Date(),
              ...(user?.uid && { completedBy: user.uid }),
            }
          : {}),
        updatedAt: new Date(),
      };

      onActionItemUpdate?.(updatedItem);
    } catch (error) {
      console.error('Error updating action item:', error);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const renderActionItem = ({ item }: { item: AIActionItem }) => {
    const isUpdating = updatingIds.has(item.id);
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={[
          styles.actionItemContainer,
          isCompleted && styles.completedContainer,
        ]}
        onPress={() => onActionItemPress?.(item)}
        activeOpacity={0.7}
        disabled={isUpdating}
      >
        <View style={styles.actionItemRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleToggleComplete(item)}
            disabled={isUpdating}
          >
            <View
              style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
            >
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <View style={styles.actionItemContent}>
            <View style={styles.actionItemHeader}>
              <Text
                style={[
                  styles.actionItemText,
                  isCompleted && styles.completedText,
                ]}
              >
                {item.task}
              </Text>
              <PriorityBadge priority={item.priority} size="small" />
            </View>

            {item.text && (
              <Text
                style={[
                  styles.actionItemDescription,
                  isCompleted && styles.completedText,
                ]}
              >
                {item.text}
              </Text>
            )}

            <View style={styles.actionItemMeta}>
              {item.assignedTo && (
                <Text style={styles.metaText}>👤 {item.assignedTo}</Text>
              )}
              {item.dueDate && (
                <Text style={styles.metaText}>
                  📅 Due:{' '}
                  {new Date(item.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {isCompleted && item.completedAt && (
                <Text style={styles.completedDateText}>
                  ✅ Completed:{' '}
                  {new Date(item.completedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {!isCompleted && item.status === 'pending' && (
                <Text style={styles.statusText}>⏳ Pending</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const pendingCount = actionItems.filter(
    item => item.status === 'pending'
  ).length;
  const completedCount = actionItems.filter(
    item => item.status === 'completed'
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Action Items ({actionItems.length})</Text>
        <Text style={styles.countText}>
          {pendingCount} pending, {completedCount} completed
        </Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search action items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#8E8E93"
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'all' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({actionItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'pending' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'pending' && styles.filterTabTextActive,
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'No action items match your search'
              : `No ${filterStatus === 'all' ? '' : filterStatus} action items`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderActionItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  actionItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionItemDescription: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  actionItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionItemRow: {
    flexDirection: 'row',
  },
  actionItemText: {
    color: '#000000',
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginRight: 8,
  },
  assigneeText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 4,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C7C7CC',
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxContainer: {
    marginRight: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedContainer: {
    backgroundColor: '#F8F8F8',
    borderLeftColor: '#34C759',
    opacity: 0.7,
  },
  completedDateText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '500',
  },
  completedText: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  container: {
    flex: 1,
  },
  countText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 12,
  },
  filterTab: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 16,
  },
  metaText: {
    color: '#666666',
    fontSize: 12,
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    fontSize: 16,
    padding: 12,
  },
  statusText: {
    color: '#666666',
    fontSize: 14,
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});
