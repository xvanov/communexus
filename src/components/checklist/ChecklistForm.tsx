import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { createChecklist, createChecklistItem } from '../../services/checklistService';
import { useAuth } from '../../hooks/useAuth';

interface ChecklistFormProps {
  threadId: string;
  onSave?: (checklistId: string) => void;
  onCancel?: () => void;
}

export const ChecklistForm: React.FC<ChecklistFormProps> = ({
  threadId,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<{ title: string }[]>([]);
  const [itemInputs, setItemInputs] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleAddItem = () => {
    setItemInputs([...itemInputs, '']);
  };

  const handleItemInputChange = (index: number, value: string) => {
    const newInputs = [...itemInputs];
    newInputs[index] = value;
    setItemInputs(newInputs);
  };

  const handleRemoveItem = (index: number) => {
    if (itemInputs.length > 1) {
      const newInputs = itemInputs.filter((_, i) => i !== index);
      setItemInputs(newInputs);
    }
  };

  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a checklist title');
      return;
    }

    // Collect non-empty items
    const validItems = itemInputs
      .map(input => input.trim())
      .filter(input => input.length > 0);

    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item to the checklist');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create a checklist');
      return;
    }

    try {
      setSaving(true);

      // Create checklist
      const checklist = await createChecklist(threadId, title.trim(), user.uid);

      // Create items
      for (let i = 0; i < validItems.length; i++) {
        await createChecklistItem(checklist.id, {
          checklistId: checklist.id,
          title: validItems[i],
          status: 'pending',
          order: i,
        });
      }

      setSaving(false);
      onSave?.(checklist.id);
    } catch (error) {
      console.error('Failed to create checklist:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to create checklist. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Checklist Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter checklist title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8E8E93"
            editable={!saving}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Items *</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
              disabled={saving}
            >
              <Text style={styles.addButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {itemInputs.map((input, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                style={styles.itemInput}
                placeholder={`Item ${index + 1}`}
                value={input}
                onChangeText={value => handleItemInputChange(index, value)}
                placeholderTextColor="#8E8E93"
                editable={!saving}
              />
              {itemInputs.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                  disabled={saving}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

