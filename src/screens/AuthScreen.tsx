import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';
import {
  initializeTestUserContacts,
  autoCreateTestUsers,
} from '../services/contacts';
import { Logo } from '../components/Logo';

export default function AuthScreen({
  onAuthSuccess,
}: {
  onAuthSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const { auth } = await initializeFirebase();

      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // Set display name in Firebase Auth
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(userCredential.user, {
          displayName: name.trim(),
        });

        // Create user document in Firestore with name
        const { upsertCurrentUser } = await import('../services/users');
        await upsertCurrentUser({
          name: name.trim(),
          email: email.trim(),
        });

        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      // Create user document in Firestore if signing up or logging in
      if (auth.currentUser) {
        console.log(
          'Creating/updating user document for:',
          auth.currentUser.email
        );

        // Map email to proper name for demo users
        const emailToName: Record<string, string> = {
          'alice@demo.com': 'Alice Johnson',
          'bob@demo.com': 'Bob Smith',
          'charlie@demo.com': 'Charlie Davis',
        };

        const properName =
          emailToName[auth.currentUser.email || ''] ||
          auth.currentUser.displayName ||
          auth.currentUser.email ||
          'User';

        const { upsertCurrentUser } = await import('../services/users');
        try {
          await upsertCurrentUser({
            name: properName,
            email: auth.currentUser.email || '',
          });
          console.log('✅ User document created/updated successfully');
        } catch (error) {
          console.error('❌ Failed to create user document:', error);
        }

        // Test notification functionality first
        try {
          console.log('🧪 AUTH: Testing notification functionality...');
          const { testNotificationPermissions } = await import(
            '../services/testNotifications'
          );
          await testNotificationPermissions();
        } catch (testError) {
          console.error('❌ AUTH: Notification test failed:', testError);
        }

        // Initialize push notifications for the user
        try {
          console.log('🔔 AUTH: Starting notification initialization...');
          const { initializeNotifications } = await import(
            '../services/notifications'
          );
          await initializeNotifications();
          console.log('✅ AUTH: Push notifications initialized successfully');
        } catch (notificationError) {
          console.error(
            '❌ AUTH: Failed to initialize notifications:',
            notificationError
          );
        }

        // Initialize contacts for test users
        try {
          await initializeTestUserContacts(auth.currentUser.uid);
        } catch (contactError) {
          console.log('Contacts initialization skipped:', contactError);
        }
      }

      onAuthSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (Platform.OS === 'web') {
      // For web, show demo user selection buttons
      setShowDemoUsers(true);
    } else {
      // For mobile, use Alert.alert
      Alert.alert('Choose Demo User', 'Select a demo user to sign in with:', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Alice', onPress: () => signInAsDemoUser('alice@demo.com') },
        { text: 'Bob', onPress: () => signInAsDemoUser('bob@demo.com') },
        {
          text: 'Charlie',
          onPress: () => signInAsDemoUser('charlie@demo.com'),
        },
      ]);
    }
  };

  const handleCreateDemoUsers = async () => {
    setLoading(true);
    try {
      console.log('Manually creating demo users...');
      await autoCreateTestUsers();
      Alert.alert(
        'Success',
        'Demo users created successfully! You can now sign in with them.'
      );
    } catch (error: any) {
      console.error('Failed to create demo users:', error);
      Alert.alert(
        'Error',
        `Failed to create demo users: ${error.message}\n\nMake sure Firebase emulators are running:\nnpx firebase emulators:start --only firestore,auth,storage --project demo-communexus`
      );
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoUser = async (email: string) => {
    setLoading(true);
    try {
      const { auth } = await initializeFirebase();

      // Auto-create test users first
      console.log('Creating test users before sign in...');
      await autoCreateTestUsers();

      // Sign in with selected user
      console.log(`Signing in as ${email}...`);
      await signInWithEmailAndPassword(auth, email, 'password123');

      // Initialize contacts for test user
      try {
        if (auth.currentUser) {
          // Initialize push notifications for demo user
          try {
            console.log('🧪 DEMO: Testing notification functionality...');
            const { testNotificationPermissions } = await import(
              '../services/testNotifications'
            );
            await testNotificationPermissions();
          } catch (testError) {
            console.error('❌ DEMO: Notification test failed:', testError);
          }

          // Test push notification flow
          try {
            console.log('🧪 DEMO: Testing push notification flow...');
            const { testPushNotificationFlow } = await import(
              '../services/testPushNotifications'
            );
            await testPushNotificationFlow();
          } catch (pushTestError) {
            console.error(
              '❌ DEMO: Push notification flow test failed:',
              pushTestError
            );
          }

          try {
            console.log('🔔 DEMO: Starting notification initialization...');
            const { initializeNotifications } = await import(
              '../services/notifications'
            );
            await initializeNotifications();
            console.log('✅ DEMO: Push notifications initialized successfully');
          } catch (notificationError) {
            console.error(
              '❌ DEMO: Failed to initialize notifications:',
              notificationError
            );
          }

          await initializeTestUserContacts(auth.currentUser.uid);
        }
      } catch (contactError) {
        console.log('Contacts initialization skipped:', contactError);
      }

      console.log('Demo user sign in successful');
      onAuthSuccess();
    } catch (error: any) {
      console.error('Demo login error:', error);
      Alert.alert('Error', `Failed to sign in as ${email}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={120} />
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
              testID="name-input"
              accessibilityLabel="name-input"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            testID="email-input"
            accessibilityLabel="email-input"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            testID="password-input"
            accessibilityLabel="password-input"
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAuth}
            disabled={loading}
            testID="sign-in-button"
            accessibilityLabel={isSignUp ? 'Sign Up button' : 'Sign In button'}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                testID="loading-indicator"
              />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            testID="sign-up-button"
            accessibilityLabel={
              isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'
            }
          >
            <Text style={styles.linkText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.demoButton]}
            onPress={handleDemoLogin}
            disabled={loading}
            testID="test-user-button"
            accessibilityLabel="Try Demo User button"
          >
            <Text style={styles.buttonText}>Try Demo User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createUsersButton]}
            onPress={handleCreateDemoUsers}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Create Demo Users</Text>
          </TouchableOpacity>

          {showDemoUsers && Platform.OS === 'web' && (
            <View style={styles.demoUserSelection}>
              <Text style={styles.demoUserTitle}>Choose Demo User:</Text>
              <View style={styles.demoUserButtons}>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('alice@demo.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Alice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('bob@demo.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Bob</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('charlie@demo.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Charlie</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDemoUsers(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Demo Users:</Text>
          <Text style={styles.infoText}>
            alice@demo.com / password123{'\n'}
            bob@demo.com / password123{'\n'}
            charlie@demo.com / password123{'\n'}
            {'\n'}Click "Try Demo User" to select one,{'\n'}
            or create your own account above!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    paddingTop: 80,
  },
  createUsersButton: {
    backgroundColor: '#8B5CF6',
    marginTop: 10,
  },
  demoButton: {
    backgroundColor: '#1E3A8A',
    marginTop: 20,
  },
  demoUserButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '45%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  demoUserButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  demoUserButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  demoUserSelection: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 20,
  },
  demoUserTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    padding: 20,
  },
  infoText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    padding: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#1E3A8A',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  testUsersButton: {
    backgroundColor: '#FF6B35',
    marginTop: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});
