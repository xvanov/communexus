// GroupCreateScreen.tsx - Create group chat and manage participants
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createThread, findOrCreateOneOnOneThread } from '../services/threads';
import { getUserContacts, Contact } from '../services/contacts';
import ContactPicker from '../components/common/ContactPicker';

export default function GroupCreateScreen({ navigation }: any) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [creating, setCreating] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    loadContacts();
  }, [user?.uid]);

  const loadContacts = async () => {
    if (!user?.uid) {
      setLoadingContacts(false);
      return;
    }

    try {
      const userContacts = await getUserContacts(user.uid);
      setContacts(userContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContacts([...selectedContacts, contact]);
  };

  const handleDeselectContact = (contact: Contact) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
  };

  const handleCreateGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to create a group');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    setCreating(true);

    try {
      // Create participant details
      const participantDetails = [
        {
          id: user.uid,
          name: user.displayName || user.email || 'You',
          ...(user.photoURL && { photoUrl: user.photoURL }),
        },
        ...selectedContacts.map(contact => ({
          id: contact.id,
          name: contact.name,
          ...(contact.photoUrl && { photoUrl: contact.photoUrl }),
        })),
      ];

      // Create participant IDs
      const participantIds = [
        user.uid,
        ...selectedContacts.map(contact => contact.id),
      ];

      // Create the thread
      const threadId = await createThread(
        participantIds,
        participantDetails,
        true, // isGroup
        groupName.trim()
      );

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Chat', {
              threadId,
              thread: {
                id: threadId,
                participants: participantIds,
                participantDetails,
                isGroup: true,
                groupName: groupName.trim(),
                lastMessage: {
                  text: '',
                  senderId: '',
                  senderName: '',
                  timestamp: new Date(),
                },
                unreadCount: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateOneOnOne = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to start a conversation');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select a contact');
      return;
    }

    if (selectedContacts.length > 1) {
      Alert.alert('Error', 'Please select only one contact for a 1-on-1 chat');
      return;
    }

    setCreating(true);

    try {
      const contact = selectedContacts[0];

      // For one-on-one chats, use the proper function to prevent duplicates
      const threadId = await findOrCreateOneOnOneThread(
        user.uid,
        contact.id,
        {
          id: user.uid,
          name: user.displayName || user.email || 'You',
          ...(user.photoURL && { photoUrl: user.photoURL }),
        },
        {
          id: contact.id,
          name: contact.name,
          ...(contact.photoUrl && { photoUrl: contact.photoUrl }),
        }
      );

      // Navigate to the chat
      navigation.navigate('Chat', {
        threadId,
        contact,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loadingContacts) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Contacts</Text>
        <Text style={styles.emptyText}>
          You don't have any contacts yet. Add some friends to start chatting!
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} testID="group-create-title">
          New Conversation
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Name</Text>
          <TextInput
            style={styles.textInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name (optional)"
            placeholderTextColor="#8E8E93"
            editable={!creating}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Participants</Text>
          <ContactPicker
            contacts={contacts}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onDeselectContact={handleDeselectContact}
            multiSelect={true}
            placeholder="Select contacts..."
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.groupButton]}
            onPress={handleCreateGroup}
            disabled={creating || selectedContacts.length === 0}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Group</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.oneOnOneButton]}
            onPress={handleCreateOneOnOne}
            disabled={creating || selectedContacts.length !== 1}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Start 1-on-1 Chat</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Group Chat:</Text> Select multiple
            contacts and create a group for project discussions
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>1-on-1 Chat:</Text> Select one contact
            to start a private conversation
          </Text>
          <Text style={styles.infoText}>
            • Participants will be notified when added to the conversation
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bold: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 16,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  groupButton: {
    backgroundColor: '#007AFF',
  },
  header: {
    borderBottomColor: '#E5E5E7',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 10,
  },
  oneOnOneButton: {
    backgroundColor: '#34C759',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E7',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
