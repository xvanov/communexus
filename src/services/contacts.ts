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
    // Update user's own status in users collection
    await setDoc(
      userRef,
      {
        online,
        lastSeen: new Date(),
      },
      { merge: true }
    );

    // Also update this user in all other users' contact lists
    // This ensures the green circle shows up in real-time
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const updatePromises = [];
    for (const userDoc of usersSnapshot.docs) {
      const contactRef = doc(db, 'users', userDoc.id, 'contacts', userId);
      const contactDoc = await getDoc(contactRef);

      if (contactDoc.exists()) {
        // This user has userId in their contacts, update the online status
        updatePromises.push(
          setDoc(
            contactRef,
            {
              online,
              lastSeen: new Date(),
            },
            { merge: true }
          )
        );
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

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
  const db = getDb();

  // Fetch all users from Firestore to get their actual UIDs
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  const demoEmails = ['alice@demo.com', 'bob@demo.com', 'charlie@demo.com'];
  const demoUsers: Contact[] = [];

  // Find demo users by email and use their Firebase UIDs
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    if (demoEmails.includes(userData.email)) {
      demoUsers.push({
        id: doc.id, // Use Firebase UID, not email!
        name: userData.name || userData.email,
        email: userData.email,
        photoUrl: userData.photoUrl,
        online: userData.online || false,
        lastSeen: userData.lastSeen?.toDate() || new Date(),
      });
    }
  });

  try {
    // Add all demo users except current user as contacts
    for (const contact of demoUsers) {
      if (contact.id !== currentUserId) {
        try {
          await addContact(currentUserId, contact);
          console.log(`Added contact: ${contact.name} (${contact.id})`);
        } catch (error) {
          console.log(`Failed to add contact ${contact.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize test user contacts:', error);
    throw error;
  }
};
