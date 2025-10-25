// ContactPicker.tsx - Dropdown contact picker component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';

// Temporary type definition to avoid importing from contacts
interface Contact {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  phone?: string;
  online?: boolean;
  lastSeen?: Date;
}

interface ContactPickerProps {
  contacts: Contact[];
  selectedContacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onDeselectContact: (contact: Contact) => void;
  multiSelect?: boolean;
  placeholder?: string;
}

export default function ContactPicker({
  contacts,
  selectedContacts,
  onSelectContact,
  onDeselectContact,
  multiSelect = false,
  placeholder = 'Select contact...',
}: ContactPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email &&
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectContact = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);

    if (isSelected) {
      onDeselectContact(contact);
    } else {
      onSelectContact(contact);
      if (!multiSelect) {
        setModalVisible(false);
      }
    }
  };

  const isContactSelected = (contact: Contact) => {
    return selectedContacts.some(c => c.id === contact.id);
  };

  const getDisplayText = () => {
    if (selectedContacts.length === 0) {
      return placeholder;
    }
    if (selectedContacts.length === 1) {
      return selectedContacts[0]?.name || 'Selected';
    }
    return `${selectedContacts.length} contacts selected`;
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    const isSelected = isContactSelected(item);

    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => handleSelectContact(item)}
      >
        <View style={styles.contactInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactEmail}>{item.email}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerButtonText}>{getDisplayText()}</Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      {selectedContacts.length > 0 && multiSelect && (
        <View style={styles.selectedContactsContainer}>
          {selectedContacts.map(contact => (
            <TouchableOpacity
              key={contact.id}
              style={styles.selectedContactChip}
              onPress={() => onDeselectContact(contact)}
            >
              <Text style={styles.selectedContactName}>{contact.name}</Text>
              <Text style={styles.removeIcon}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {multiSelect ? 'Select Contacts' : 'Select Contact'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.id}
              style={styles.contactList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No contacts found</Text>
              }
            />

            {multiSelect && selectedContacts.length > 0 && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>
                  Done ({selectedContacts.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkmark: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  contactDetails: {
    flex: 1,
  },
  contactEmail: {
    color: '#94A3B8',
    fontSize: 12,
  },
  contactInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  contactItem: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    padding: 12,
  },
  contactItemSelected: {
    backgroundColor: '#334155',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  contactList: {
    flex: 1,
    width: '100%',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    width: '100%',
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginTop: 12,
    padding: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownIcon: {
    color: '#94A3B8',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerButton: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  removeIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 8,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
  },
  selectedContactChip: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedContactName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectedContactsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
