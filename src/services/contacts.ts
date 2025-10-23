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

  // Map to track user presence subscriptions
  const presenceUnsubscribers: Record<string, () => void> = {};

  // Use Map to store contacts so presence updates work correctly
  const contactsMap = new Map<string, Contact>();

  const contactsUnsubscribe = onSnapshot(contactsRef, snapshot => {
    const contactIds: string[] = [];

    // Get all contact IDs
    snapshot.forEach(doc => {
      const data = doc.data();
      contactIds.push(doc.id);

      // Initialize contact in map
      if (!contactsMap.has(doc.id)) {
        contactsMap.set(doc.id, {
          id: doc.id,
          name: data.name,
          email: data.email,
          photoUrl: data.photoUrl,
          online: false,
          lastSeen: data.lastSeen?.toDate() || new Date(),
        });
      }
    });

    // Clean up removed contacts
    Object.keys(presenceUnsubscribers).forEach(id => {
      if (!contactIds.includes(id)) {
        const unsub = presenceUnsubscribers[id];
        if (unsub) unsub();
        delete presenceUnsubscribers[id];
        contactsMap.delete(id);
      }
    });

    // Subscribe to presence for each contact
    for (const contactId of contactIds) {
      const contactDoc = snapshot.docs.find(d => d.id === contactId);
      if (!contactDoc) continue;

      const contactData = contactDoc.data();

      if (!presenceUnsubscribers[contactId]) {
        const userRef = doc(db, 'users', contactId);

        presenceUnsubscribers[contactId] = onSnapshot(userRef, userSnap => {
          const userData = userSnap.data();

          // Update contact in map with latest presence
          const updatedContact: Contact = {
            id: contactId,
            name: userData?.name || contactData.name || contactData.email,
            email: contactData.email,
            photoUrl: userData?.photoUrl || contactData.photoUrl,
            online: userData?.online === true, // Explicitly check for boolean true
            lastSeen: userData?.lastSeen?.toDate() || new Date(),
          };

          contactsMap.set(contactId, updatedContact);

          // Callback with updated array from map
          callback(Array.from(contactsMap.values()));
        });
      }
    }

    // Initial callback
    callback(Array.from(contactsMap.values()));
  });

  // Return cleanup function that unsubscribes from everything
  return () => {
    contactsUnsubscribe();
    Object.values(presenceUnsubscribers).forEach(unsub => unsub());
  };
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
      {
        email: 'alice@demo.com',
        password: 'password123',
        name: 'Alice Johnson',
      },
      { email: 'bob@demo.com', password: 'password123', name: 'Bob Smith' },
      {
        email: 'charlie@demo.com',
        password: 'password123',
        name: 'Charlie Davis',
      },
    ];

    console.log('Auto-creating test users...');

    for (const user of testUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );

        // Set display name
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(userCredential.user, {
          displayName: user.name,
        });

        // Create user document in Firestore
        const db = getDb(true);
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(
          doc(db, 'users', userCredential.user.uid),
          {
            id: userCredential.user.uid,
            email: user.email,
            name: user.name,
            online: false,
            lastSeen: new Date(),
            role: 'contractor',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );

        console.log(`✅ Created test user: ${user.email} (${user.name})`);
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
      id: 'alice@demo.com',
      name: 'Alice Johnson',
      email: 'alice@demo.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'bob@demo.com',
      name: 'Bob Smith',
      email: 'bob@demo.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'charlie@demo.com',
      name: 'Charlie Davis',
      email: 'charlie@demo.com',
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
