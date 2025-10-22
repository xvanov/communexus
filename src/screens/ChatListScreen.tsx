// ChatListScreen.tsx - Thread list with unread counts and last message preview
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { useThreads } from '../hooks/useThreads';
import { Thread } from '../types/Thread';
import { useAuth } from '../hooks/useAuth';
import { ThreadItem } from '../components/thread/ThreadItem';
import { initializeFirebase } from '../services/firebase';

export default function ChatListScreen({ navigation }: any) {
  const { threads, loading, error } = useThreads();
  const { user } = useAuth();

  const handleThreadPress = (thread: Thread) => {
    navigation.navigate('Chat', { threadId: thread.id, thread });
  };

  const handleCreateThread = () => {
    navigation.navigate('GroupCreate');
  };

  const handleContacts = () => {
    navigation.navigate('Contacts');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { auth } = initializeFirebase();
              await signOut(auth);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading conversations</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Please sign in to view conversations
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Communexus</Text>
          <Text style={styles.usernameText}>
            {user?.displayName || user?.email || 'User'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.contactsButton} onPress={handleContacts}>
            <Text style={styles.contactsButtonText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateThread}
          >
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {threads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new conversation with your team or clients
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleCreateThread}
          >
            <Text style={styles.emptyButtonText}>Create Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ThreadItem
              thread={item}
              onPress={handleThreadPress}
              currentUserId={user.uid}
            />
          )}
          style={styles.threadList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usernameText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contactsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  contactsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  threadList: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
