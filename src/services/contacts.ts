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

  // Build contact data without undefined values
  const contactData: any = {
    name: contact.name,
    email: contact.email,
    online: contact.online,
    lastSeen: contact.lastSeen,
    addedAt: new Date(),
  };

  // Only add photoUrl if it exists
  if (contact.photoUrl) {
    contactData.photoUrl = contact.photoUrl;
  }

  await setDoc(contactRef, contactData);
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

  // Store unsubscribe functions for user listeners
  const userUnsubscribes: (() => void)[] = [];
  let contactsSnapshot: any = null;

  const unsubscribeContacts = onSnapshot(contactsRef, snapshot => {
    console.log('📞 Contacts updated:', snapshot.docs.length, 'contacts');
    
    // Clean up previous user listeners
    userUnsubscribes.forEach(unsub => unsub());
    userUnsubscribes.length = 0;

    contactsSnapshot = snapshot;
    const contacts: Contact[] = [];

    if (snapshot.docs.length === 0) {
      callback([]);
      return;
    }

    // For each contact, set up a real-time listener for their user document
    snapshot.docs.forEach(contactDoc => {
      const contactData = contactDoc.data();
      const contactId = contactDoc.id;

      // Set up real-time listener for this user's online status
      const userRef = doc(db, 'users', contactId);
      const unsubscribeUser = onSnapshot(userRef, userSnapshot => {
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          
          const contact: Contact = {
            id: contactId,
            name: contactData.name,
            email: contactData.email,
            photoUrl: contactData.photoUrl,
            online: Boolean(userData?.online),
            lastSeen: userData?.lastSeen?.toDate() || new Date(),
          };

          console.log(`👤 Contact ${contact.name}:`, {
            online: contact.online,
            lastSeen: contact.lastSeen.toLocaleTimeString()
          });

          // Update the contacts array and notify callback
          const existingIndex = contacts.findIndex(c => c.id === contactId);
          if (existingIndex >= 0) {
            contacts[existingIndex] = contact;
          } else {
            contacts.push(contact);
          }

          // Sort contacts and notify callback
          const sortedContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
          callback(sortedContacts);
        }
      }, error => {
        console.error(`Error listening to user ${contactId}:`, error);
      });

      userUnsubscribes.push(unsubscribeUser);
    });
  });

  // Return cleanup function
  return () => {
    unsubscribeContacts();
    userUnsubscribes.forEach(unsub => unsub());
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
    // Update user's own status in users collection
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
      let userId: string | null = null;
      let isNewUser = false;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );
        userId = userCredential.user.uid;
        isNewUser = true;

        // Set display name
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(userCredential.user, {
          displayName: user.name,
        });

        console.log(`✅ Created NEW Auth user: ${user.email} (${user.name})`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ Auth user already exists: ${user.email}`);
          // Skip - Firestore doc will be created when they actually log in
        } else {
          console.error(
            `❌ Failed to create test user ${user.email}:`,
            error.message
          );
        }
      }

      // Create Firestore document for NEW users
      if (userId && isNewUser) {
        try {
          const db = getDb(true);
          const { setDoc, doc } = await import('firebase/firestore');
          await setDoc(
            doc(db, 'users', userId),
            {
              id: userId,
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
          console.log(`✅ Created Firestore doc for NEW user: ${user.email}`);
        } catch (firestoreError) {
          console.error(
            `Failed to create Firestore doc for ${user.email}:`,
            firestoreError
          );
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

  console.log(`Initializing contacts for user: ${currentUserId}`);

  // First, ensure the current user has a proper document
  await ensureCurrentUserDocument(currentUserId);

  // Fetch all users from Firestore to get their actual UIDs
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  console.log(`Found ${usersSnapshot.docs.length} users in Firestore`);

  const demoEmails = ['alice@demo.com', 'bob@demo.com', 'charlie@demo.com'];
  const demoUsers: Contact[] = [];

  // Find demo users by email and use their Firebase UIDs
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    console.log(`Checking user: ${userData.email || 'NO EMAIL'} (${doc.id})`);
    console.log(`User data:`, { 
      email: userData.email, 
      name: userData.name, 
      hasEmail: !!userData.email,
      hasName: !!userData.name 
    });

    if (demoEmails.includes(userData.email)) {
      const contact: Contact = {
        id: doc.id, // Use Firebase UID, not email!
        name: userData.name || userData.email,
        email: userData.email,
        photoUrl: userData.photoUrl,
        online: userData.online || false,
        lastSeen: userData.lastSeen?.toDate() || new Date(),
      };
      demoUsers.push(contact);
      console.log(`✅ Added to demo users list: ${contact.name} (${contact.id})`);
    } else {
      console.log(`❌ Skipped user ${doc.id}: email ${userData.email} not in demo list`);
    }
  });

  console.log(`Found ${demoUsers.length} demo users to add as contacts`);

  // Add all demo users except current user as contacts
  let addedCount = 0;
  for (const contact of demoUsers) {
    if (contact.id !== currentUserId) {
      try {
        console.log(`Adding contact: ${contact.name} (${contact.id})`);
        await addContact(currentUserId, contact);
        addedCount++;
        console.log(`✅ Successfully added contact: ${contact.name}`);
      } catch (error) {
        console.error(`❌ Failed to add contact ${contact.name}:`, error);
      }
    } else {
      console.log(`Skipping self: ${contact.name}`);
    }
  }

  console.log(
    `✅ Contact initialization complete: ${addedCount} contacts added`
  );
};

// Ensure the current user has a proper Firestore document
const ensureCurrentUserDocument = async (currentUserId: string): Promise<void> => {
  console.log('🔧 Ensuring current user document exists...');
  
  const db = getDb();
  const userDocRef = doc(db, 'users', currentUserId);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    console.log(`❌ No Firestore document found for current user: ${currentUserId}`);
    return;
  }
  
  const userData = userDoc.data();
  console.log(`Current user document data:`, userData);
  
  // Check if the document has the required fields
  if (!userData.email || !userData.name) {
    console.log(`🔧 Current user document is incomplete, updating...`);
    
    // We need to get the email from Firebase Auth since we can't query by email
    const { initializeFirebase } = await import('./firebase');
    const { auth } = initializeFirebase();
    const currentUser = auth.currentUser;
    
    if (currentUser && currentUser.email) {
      // Map email to name
      const emailToName: Record<string, string> = {
        'alice@demo.com': 'Alice Johnson',
        'bob@demo.com': 'Bob Smith',
        'charlie@demo.com': 'Charlie Davis',
      };
      
      const name = emailToName[currentUser.email] || currentUser.displayName || currentUser.email;
      
      console.log(`🔧 Updating current user document with email: ${currentUser.email}, name: ${name}`);
      
      // Update the document with proper fields
      await setDoc(userDocRef, {
        id: currentUserId,
        email: currentUser.email,
        name: name,
        online: userData.online || true,
        lastSeen: userData.lastSeen || new Date(),
        role: userData.role || 'contractor',
        createdAt: userData.createdAt || new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      
      console.log(`✅ Updated current user document`);
    } else {
      console.log(`❌ Could not get current user email from Auth`);
    }
  } else {
    console.log(`✅ Current user document already complete`);
  }
};

