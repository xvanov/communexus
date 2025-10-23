// GroupCreateScreen.tsx - Create group chat and manage participants
import React, { useState } from 'react';
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
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';

export default function GroupCreateScreen({ navigation }: any) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [participantEmails, setParticipantEmails] = useState('');
  const [creating, setCreating] = useState(false);

  // Get the actual Firebase Auth UID for test users
  const getUserIdForEmail = async (email: string): Promise<string> => {
    // For now, we'll use a simple approach: if it's a test user email,
    // we'll use the email as the ID since that's what we're using in the auth system
    // In a real app, you'd look up the actual Firebase Auth UID
    return email;
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

    const emails = participantEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      Alert.alert('Error', 'Please add at least one participant');
      return;
    }

    setCreating(true);

    try {
      // Create participant details (simplified - in real app, you'd fetch user details)
      const participantDetails = [
        {
          id: user.uid,
          name: user.displayName || user.email || 'You',
          ...(user.photoURL && { photoUrl: user.photoURL }),
        },
        ...emails.map(email => ({
          id:
            email === 'a@test.com'
              ? 'a@test.com'
              : email === 'b@test.com'
                ? 'b@test.com'
                : email === 'demo@communexus.com'
                  ? 'demo@communexus.com'
                  : `temp_${email}`,
          name: email,
        })),
      ];

      // Create participant IDs (simplified for group chats)
      const participantIds = [
        user.uid,
        ...emails.map(email =>
          email === 'a@test.com'
            ? 'a@test.com'
            : email === 'b@test.com'
              ? 'b@test.com'
              : email === 'demo@communexus.com'
                ? 'demo@communexus.com'
                : `temp_${email}`
        ),
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

    const email = participantEmails.trim();
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setCreating(true);

    try {
      // For test users, use their actual email as the ID
      // This ensures both users can see the thread
      const otherUserId =
        email === 'a@test.com'
          ? 'a@test.com'
          : email === 'b@test.com'
            ? 'b@test.com'
            : email === 'demo@communexus.com'
              ? 'demo@communexus.com'
              : `temp_${email}`;

      // For one-on-one chats, use the proper function to prevent duplicates
      const threadId = await findOrCreateOneOnOneThread(
        user.uid,
        otherUserId,
        {
          id: user.uid,
          name: user.displayName || user.email || 'You',
          ...(user.photoURL && { photoUrl: user.photoURL }),
        },
        {
          id: otherUserId,
          name: email,
        }
      );

      // Define participants for navigation
      const directChatParticipantIds = [user.uid, otherUserId];
      const directChatParticipantDetails = [
        {
          id: user.uid,
          name: user.displayName || user.email || 'You',
          email: user.email || '',
        },
        {
          id: otherUserId,
          name: email,
          email,
        },
      ];

      Alert.alert('Success', 'Conversation started!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Chat', {
              threadId,
              thread: {
                id: threadId,
                participants: directChatParticipantIds,
                participantDetails: directChatParticipantDetails,
                isGroup: false,
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
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

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
            editable={!creating}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={participantEmails}
            onChangeText={setParticipantEmails}
            placeholder="Enter email addresses separated by commas"
            multiline
            editable={!creating}
          />
          <Text style={styles.helpText}>
            Enter email addresses separated by commas. For example:
            john@example.com, jane@example.com
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.groupButton]}
            onPress={handleCreateGroup}
            disabled={creating}
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
            disabled={creating}
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
            • <Text style={styles.bold}>Group Chat:</Text> Create a group with
            multiple participants for project discussions
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>1-on-1 Chat:</Text> Start a private
            conversation with a single person
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
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    padding: 16,
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
  helpText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
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
