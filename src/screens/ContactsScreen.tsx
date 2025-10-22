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
import {
  Contact,
  subscribeToContacts,
  updateUserOnlineStatus,
  initializeTestUserContacts,
} from '../services/contacts';
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

    const unsubscribe = subscribeToContacts(user.uid, updatedContacts => {
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
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
    >
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{item.name}</Text>
          <View
            style={[
              styles.onlineIndicator,
              item.online && styles.onlineIndicatorActive,
            ]}
          />
        </View>
        <Text style={styles.contactEmail}>{item.email}</Text>
        <Text style={styles.lastSeen}>
          {item.online
            ? 'Online'
            : `Last seen ${formatLastSeen(item.lastSeen)}`}
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
          keyExtractor={item => item.id}
          renderItem={renderContact}
          style={styles.contactsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contactEmail: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  contactHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
  },
  contactItem: {
    backgroundColor: '#000000',
    borderBottomColor: '#1C1C1E',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactsList: {
    flex: 1,
  },
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  header: {
    backgroundColor: '#1E3A8A',
    borderBottomColor: '#1E40AF',
    borderBottomWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  initButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  initButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lastSeen: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 12,
  },
  onlineIndicator: {
    backgroundColor: '#C7C7CC',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  onlineIndicatorActive: {
    backgroundColor: '#34C759',
  },
});
