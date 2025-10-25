import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { AIActionItem } from '../../types/AIFeatures';
import { ActionItemList } from './ActionItemList';

interface ActionItemModalProps {
  visible: boolean;
  onClose: () => void;
  actionItems: AIActionItem[];
  onActionItemPress?: (actionItem: AIActionItem) => void;
}

export const ActionItemModal: React.FC<ActionItemModalProps> = ({
  visible,
  onClose,
  actionItems,
  onActionItemPress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Action Items</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="close-action-items"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {actionItems.length > 0 ? (
            <ActionItemList
              actionItems={actionItems}
              {...(onActionItemPress && { onActionItemPress })}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No action items found</Text>
              <Text style={styles.emptySubtext}>
                Action items will appear here when detected in your conversation
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 18,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
  emptySubtext: {
    color: '#C7C7CC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});
