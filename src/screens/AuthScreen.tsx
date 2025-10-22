import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';
import { initializeTestUserContacts } from '../services/contacts';

export default function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const { auth } = initializeFirebase();
      await signInWithEmailAndPassword(auth, 'demo@communexus.com', 'demo123');
      
      // Initialize contacts for demo user
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
      // If demo user doesn't exist, create it
      try {
        const { auth } = initializeFirebase();
        await createUserWithEmailAndPassword(auth, 'demo@communexus.com', 'demo123');
        
        // Initialize contacts for demo user
        try {
          if (auth.currentUser) {
            await initializeTestUserContacts(auth.currentUser.uid);
          }
        } catch (contactError) {
          // eslint-disable-next-line no-console
          console.log('Contacts initialization skipped:', contactError);
        }
        
        onAuthSuccess();
      } catch (createError: any) {
        Alert.alert('Error', 'Failed to create demo account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestUsers = async () => {
    setLoading(true);
    try {
      const { auth } = initializeFirebase();
      
      const testUsers = [
        { email: 'a@test.com', password: 'password' },
        { email: 'b@test.com', password: 'password' }
      ];

      for (const user of testUsers) {
        try {
          await createUserWithEmailAndPassword(auth, user.email, user.password);
          Alert.alert('Success', `Created user: ${user.email}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            Alert.alert('Info', `User already exists: ${user.email}`);
          } else {
            Alert.alert('Error', `Failed to create user ${user.email}: ${error.message}`);
          }
        }
      }
      
      Alert.alert('Complete', 'Test users created! You can now sign in with them.');
    } catch (error: any) {
      Alert.alert('Error', `Failed to create test users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔥 Communexus</Text>
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
            <Text style={styles.buttonText}>🚀 Try Demo Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testUsersButton]}
            onPress={handleCreateTestUsers}
            disabled={loading}
          >
            <Text style={styles.buttonText}>👥 Create Test Users</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Test Accounts:</Text>
          <Text style={styles.infoText}>
            Demo: demo@communexus.com / demo123{'\n'}
            Test Users: a@test.com / password{'\n'}
            Test Users: b@test.com / password{'\n'}
            {'\n'}Or create your own account above!
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
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  demoButton: {
    backgroundColor: '#34C759',
    marginTop: 20,
  },
  form: {
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    lineHeight: 20,
  },
  infoTitle: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  testUsersButton: {
    backgroundColor: '#FF6B35',
    marginTop: 10,
  },
});