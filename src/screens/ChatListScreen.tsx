// ChatListScreen.tsx - Thread list with unread counts and last message preview
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { signOut, getAuth } from 'firebase/auth';
import { useThreads } from '../hooks/useThreads';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { usePresence } from '../hooks/usePresence';
import { useInAppNotifications } from '../hooks/useInAppNotifications';
import { Thread } from '../types/Thread';
import { useAuth } from '../hooks/useAuth';
import { ThreadItem } from '../components/thread/ThreadItem';
import { initializeFirebase } from '../services/firebase';
import { SmartSearchModal } from '../components/ai/SmartSearchModal';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

export default function ChatListScreen({ navigation }: any) {
  const { threads, loading, error } = useThreads();
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  // Automatically update badge count when threads change
  useUnreadCount(threads);

  // Track user presence (online/offline)
  usePresence();

  // Show in-app notifications for new messages
  useInAppNotifications();

  const handleThreadPress = (thread: Thread) => {
    navigation.navigate('Chat', { threadId: thread.id, thread });
  };

  const handleCreateThread = () => {
    navigation.navigate('GroupCreate');
  };

  const handleContacts = () => {
    navigation.navigate('Contacts');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const performLogout = async () => {
    try {
      console.log('Starting logout process...');
      const { auth } = await initializeFirebase();
      console.log('Current user before logout:', auth.currentUser?.email);
      await signOut(auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't show alert during tests - just log the error
      // Firebase Auth state change will handle navigation anyway
      if (process.env.NODE_ENV !== 'test' && Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to logout');
      } else if (Platform.OS === 'web' && process.env.NODE_ENV !== 'test') {
        alert('Failed to logout');
      }
    }
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');

    // Check if running in Firebase emulator/demo project (indicates test/dev environment)
    const { auth, app } = await initializeFirebase();
    const isDemoProject = app.options.projectId === 'demo-communexus';
    const isTestEnv = __DEV__ && isDemoProject;

    // Skip confirmation dialog in test/dev environments for automated testing
    if (isTestEnv && Platform.OS !== 'web') {
      console.log('Test environment detected - skipping confirmation dialog');
      await performLogout();
      return;
    }

    // For web, use confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;
      await performLogout();
    } else {
      // For mobile, use Alert.alert with accessible button
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Logout cancelled'),
          },
          {
            text: 'OK',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: false }
      );
    }
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
          <Text
            style={styles.usernameText}
            testID="chat-list-title"
            numberOfLines={1}
          >
            {user?.displayName || user?.email || 'User'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(true)}
            testID="search-button"
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={handleContacts}
            testID="contacts-button"
          >
            <Text style={styles.contactsButtonText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettings}
            testID="settings-button"
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            testID="logout-button"
          >
            <Text style={styles.logoutButtonText}>🚪</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateThread}
            testID="new-chat-button"
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
          testID="thread-list"
        />
      )}

      <SmartSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onResultPress={result => {
          console.log('Search result pressed:', result);
          // Navigate to the thread containing this message
          const thread = threads.find(t => t.id === result.threadId);
          if (thread) {
            handleThreadPress(thread);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  contactsButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  contactsButtonText: {
    fontSize: 18,
  },
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  createButtonText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '500',
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  logoutButtonText: {
    fontSize: 18,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchButtonText: {
    fontSize: 18,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.xl,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  threadList: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  usernameText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
