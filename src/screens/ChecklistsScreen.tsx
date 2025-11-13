// ChecklistsScreen.tsx - Checklist management screen for a thread
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import { ChecklistList } from '../components/checklist/ChecklistList';
import { ChecklistDetailView } from '../components/checklist/ChecklistDetailView';
import { ChecklistForm } from '../components/checklist/ChecklistForm';
import { Checklist } from '../types/Checklist';

export default function ChecklistsScreen({ route, navigation }: any) {
  const { threadId } = route.params as { threadId: string };
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const handleChecklistPress = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setShowDetail(true);
  };

  const handleCreateChecklist = () => {
    setShowForm(true);
  };

  const handleFormSave = (checklistId: string) => {
    setShowForm(false);
    // Optionally navigate to detail view
    // For now, just close the form and let the list refresh
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleDetailBack = () => {
    setShowDetail(false);
    setSelectedChecklist(null);
  };

  return (
    <View style={styles.container}>
      {!showDetail && !showForm && (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateChecklist}
            >
              <Text style={styles.createButtonText}>+ New Checklist</Text>
            </TouchableOpacity>
          </View>
          <ChecklistList
            threadId={threadId}
            onChecklistPress={handleChecklistPress}
          />
        </>
      )}

      {showDetail && selectedChecklist && (
        <ChecklistDetailView
          checklistId={selectedChecklist.id}
          onBack={handleDetailBack}
        />
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Checklist</Text>
            <TouchableOpacity onPress={handleFormCancel}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ChecklistForm
            threadId={threadId}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </View>
      </Modal>
    </View>
  );
}

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
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#8E8E93',
    padding: 4,
  },
});

