import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Checklist } from '../../types/Checklist';
import { useChecklists } from '../../hooks/useChecklists';

interface ChecklistListProps {
  threadId: string;
  onChecklistPress?: (checklist: Checklist) => void;
}

export const ChecklistList: React.FC<ChecklistListProps> = ({
  threadId,
  onChecklistPress,
}) => {
  const { checklists, loading, error } = useChecklists(threadId);

  const renderChecklist = ({ item }: { item: Checklist }) => {
    const itemCount = item.items.length;
    const completedCount = item.items.filter(
      item => item.status === 'completed'
    ).length;

    return (
      <TouchableOpacity
        style={styles.checklistItem}
        onPress={() => onChecklistPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.checklistContent}>
          <Text style={styles.checklistTitle}>{item.title}</Text>
          <Text style={styles.checklistMeta}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {completedCount > 0 && ` • ${completedCount} complete`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading checklists...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (checklists.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No checklists yet</Text>
        <Text style={styles.emptySubtext}>
          Create a checklist to start tracking tasks
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checklists ({checklists.length})</Text>
      </View>
      <FlatList
        data={checklists}
        renderItem={renderChecklist}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  listContainer: {
    padding: 16,
  },
  checklistItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  checklistMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

