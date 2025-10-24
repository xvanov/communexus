import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SmartSearch } from './SmartSearch';
import { SearchResult } from '../../types/AIFeatures';

interface SmartSearchModalProps {
  visible: boolean;
  onClose: () => void;
  threadId?: string;
  onResultPress?: (result: SearchResult) => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  visible,
  onClose,
  threadId,
  onResultPress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Smart Search</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-search">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <SmartSearch
          threadId={threadId || ''}
          onResultPress={(result) => {
            onResultPress?.(result);
            onClose(); // Close modal after selecting result
          }}
        />
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
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5E7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60, // Account for notch/status bar
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});

