// contacts.ts - Service for managing user contacts and online status
import { getDb } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { User } from '../types/User';

export interface Contact {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  online: boolean;
  lastSeen: Date;
}

// Add a contact to user's contact list
export const addContact = async (
  userId: string,
  contact: Contact
): Promise<void> => {
  const db = getDb();
  const contactRef = doc(db, 'users', userId, 'contacts', contact.id);

  await setDoc(contactRef, {
    ...contact,
    addedAt: new Date(),
  });
};

// Get all contacts for a user
export const getUserContacts = async (userId: string): Promise<Contact[]> => {
  const db = getDb();
  const contactsRef = collection(db, 'users', userId, 'contacts');
  const snapshot = await getDocs(contactsRef);

  const contacts: Contact[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    contacts.push({
      id: doc.id,
      name: data.name,
      email: data.email,
      photoUrl: data.photoUrl,
      online: data.online,
      lastSeen: data.lastSeen?.toDate() || new Date(),
    });
  });

  return contacts;
};

// Subscribe to contacts with real-time updates
export const subscribeToContacts = (
  userId: string,
  callback: (contacts: Contact[]) => void
): (() => void) => {
  const db = getDb();
  const contactsRef = collection(db, 'users', userId, 'contacts');

  return onSnapshot(contactsRef, snapshot => {
    const contacts: Contact[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      contacts.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        online: data.online || false,
        lastSeen: data.lastSeen?.toDate() || new Date(),
      });
    });
    callback(contacts);
  });
};

// Update user's online status with proper error handling
export const updateUserOnlineStatus = async (
  userId: string,
  online: boolean
): Promise<void> => {
  const db = getDb();
  const userRef = doc(db, 'users', userId);

  try {
    // Update user's own status only
    await setDoc(
      userRef,
      {
        online,
        lastSeen: new Date(),
      },
      { merge: true }
    );

    console.log(`Updated online status for ${userId}: ${online}`);
  } catch (error) {
    console.error('Failed to update online status:', error);
    throw error;
  }
};

// Auto-create test users if they don't exist
export const autoCreateTestUsers = async (): Promise<void> => {
  try {
    // Import Firebase directly
    const { initializeApp, getApps } = await import('firebase/app');
    const { connectAuthEmulator, getAuth } = await import('firebase/auth');
    const { createUserWithEmailAndPassword } = await import('firebase/auth');

    // Initialize Firebase app
    let app = getApps()[0];
    if (!app) {
      app = initializeApp({
        apiKey: 'AIzaSyC-fake-key-for-emulator',
        authDomain: 'demo-communexus.firebaseapp.com',
        projectId: 'demo-communexus',
        storageBucket: 'demo-communexus.appspot.com',
        appId: '1:123456789:web:abcdef123456',
      });
    }

    // Use simple getAuth (no AsyncStorage needed for user creation)
    const auth = getAuth(app);

    // Connect to emulator
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    } catch (e) {
      // Emulator already connected
    }

    console.log('Firebase Auth initialized successfully');

    const testUsers = [
      { email: 'john@test.com', password: 'password' },
      { email: 'jane@test.com', password: 'password' },
      { email: 'alice@test.com', password: 'password' },
      { email: 'bob@test.com', password: 'password' },
    ];

    console.log('Auto-creating test users...');

    for (const user of testUsers) {
      try {
        await createUserWithEmailAndPassword(auth, user.email, user.password);
        console.log(`✅ Created test user: ${user.email}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ Test user already exists: ${user.email}`);
        } else {
          console.error(
            `❌ Failed to create test user ${user.email}:`,
            error.message
          );
          console.error('Full error:', error);
        }
      }
    }

    console.log('Test user creation completed');
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Initialize test users as contacts for each other with better error handling
export const initializeTestUserContacts = async (
  currentUserId: string
): Promise<void> => {
  const testUsers = [
    {
      id: 'john@test.com',
      name: 'John',
      email: 'john@test.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'jane@test.com',
      name: 'Jane',
      email: 'jane@test.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'alice@test.com',
      name: 'Alice',
      email: 'alice@test.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'bob@test.com',
      name: 'Bob',
      email: 'bob@test.com',
      online: false,
      lastSeen: new Date(),
    },
  ];

  try {
    // Only add contacts for the current authenticated user
    for (const contact of testUsers) {
      if (contact.id !== currentUserId) {
        try {
          await addContact(currentUserId, contact);
        } catch (error) {
          console.log(`Failed to add contact ${contact.id}:`, error);
          // Continue with other contacts even if one fails
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize test user contacts:', error);
    throw error;
  }
};
