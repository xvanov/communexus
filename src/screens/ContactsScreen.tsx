// ContactsScreen.tsx - Display user contacts with online status
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Contact, subscribeToContacts, updateUserOnlineStatus, initializeTestUserContacts } from '../services/contacts';
import { useAuth } from '../hooks/useAuth';
import { findOrCreateOneOnOneThread } from '../services/threads';

interface ContactsScreenProps {
  navigation: any;
}

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Set user as online when they open contacts
    updateUserOnlineStatus(user.uid, true).catch(error => {
      console.log('Failed to update online status on mount:', error);
    });

    const unsubscribe = subscribeToContacts(user.uid, (updatedContacts) => {
      setContacts(updatedContacts);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Set user as offline when they leave
      updateUserOnlineStatus(user.uid, false).catch(error => {
        console.log('Failed to update online status on unmount:', error);
      });
    };
  }, [user?.uid]);

  const handleContactPress = async (contact: Contact) => {
    if (!user?.uid) return;
    
    try {
      // Use the findOrCreateOneOnOneThread function to prevent duplicates
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

      // Navigate to chat with the thread ID
      navigation.navigate('Chat', {
        threadId,
        contact,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create thread:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const handleInitializeContacts = async () => {
    if (!user?.uid) return;
    
    try {
      await initializeTestUserContacts(user.uid);
      Alert.alert('Success', 'Test user contacts initialized!');
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize contacts');
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => handleContactPress(item)}>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{item.name}</Text>
          <View style={[styles.onlineIndicator, item.online && styles.onlineIndicatorActive]} />
        </View>
        <Text style={styles.contactEmail}>{item.email}</Text>
        <Text style={styles.lastSeen}>
          {item.online ? 'Online' : `Last seen ${formatLastSeen(item.lastSeen)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return lastSeen.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Text style={styles.headerSubtitle}>{contacts.length} contacts</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptySubtitle}>
            Initialize test user contacts to get started
          </Text>
          <TouchableOpacity
            style={styles.initButton}
            onPress={handleInitializeContacts}
          >
            <Text style={styles.initButtonText}>Initialize Test Contacts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          style={styles.contactsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    backgroundColor: '#000000',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  onlineIndicatorActive: {
    backgroundColor: '#34C759',
  },
  contactEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  initButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  initButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
});
