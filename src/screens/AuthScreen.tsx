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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';
import { initializeTestUserContacts, autoCreateTestUsers } from '../services/contacts';
import { Logo } from '../components/Logo';

export default function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { auth } = initializeFirebase();
      
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      
      // Initialize contacts for test users after successful auth
      try {
        if (auth.currentUser) {
          await initializeTestUserContacts(auth.currentUser.uid);
        }
      } catch (contactError) {
        // eslint-disable-next-line no-console
        console.log('Contacts initialization skipped:', contactError);
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
      Alert.alert(
        'Choose Demo User',
        'Select a demo user to sign in with:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'John', onPress: () => signInAsDemoUser('john@test.com') },
          { text: 'Jane', onPress: () => signInAsDemoUser('jane@test.com') },
          { text: 'Alice', onPress: () => signInAsDemoUser('alice@test.com') },
          { text: 'Bob', onPress: () => signInAsDemoUser('bob@test.com') },
        ]
      );
    }
  };

  const handleCreateDemoUsers = async () => {
    setLoading(true);
    try {
      console.log('Manually creating demo users...');
      await autoCreateTestUsers();
      Alert.alert('Success', 'Demo users created successfully! You can now sign in with them.');
    } catch (error: any) {
      console.error('Failed to create demo users:', error);
      Alert.alert('Error', `Failed to create demo users: ${error.message}\n\nMake sure Firebase emulators are running:\nnpx firebase emulators:start --only firestore,auth,storage --project demo-communexus`);
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoUser = async (email: string) => {
    setLoading(true);
    try {
      const { auth } = initializeFirebase();
      
      // Auto-create test users first
      console.log('Creating test users before sign in...');
      await autoCreateTestUsers();
      
      // Sign in with selected user
      console.log(`Signing in as ${email}...`);
      await signInWithEmailAndPassword(auth, email, 'password');
      
      // Initialize contacts for test user
      try {
        if (auth.currentUser) {
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
          <Logo size={80} color="#1E3A8A" />
        </View>
        <Text style={styles.title}>Communexus</Text>
        <Text style={styles.subtitle}>Project Communication Hub</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
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
          >
            <Text style={styles.linkText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.demoButton]}
            onPress={handleDemoLogin}
            disabled={loading}
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
                  onPress={() => signInAsDemoUser('john@test.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>John</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('jane@test.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Jane</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('alice@test.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Alice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoUserButton}
                  onPress={() => signInAsDemoUser('bob@test.com')}
                  disabled={loading}
                >
                  <Text style={styles.demoUserButtonText}>Bob</Text>
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
            john@test.com / password{'\n'}
            jane@test.com / password{'\n'}
            alice@test.com / password{'\n'}
            bob@test.com / password{'\n'}
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
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  content: {
    padding: 32,
    paddingTop: 80,
    justifyContent: 'center',
    flex: 1,
  },
  demoButton: {
    backgroundColor: '#1E3A8A',
    marginTop: 20,
  },
  demoUserSelection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  demoUserTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  demoUserButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  demoUserButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: '45%',
  },
  demoUserButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createUsersButton: {
    backgroundColor: '#8B5CF6',
    marginTop: 10,
  },
  form: {
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
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
    fontSize: 16,
    marginBottom: 16,
    padding: 16,
    color: '#FFFFFF',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
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
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  testUsersButton: {
    backgroundColor: '#FF6B35',
    marginTop: 10,
  },
});