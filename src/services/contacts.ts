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

  return onSnapshot(contactsRef, async snapshot => {
    const contacts: Contact[] = [];

    // For each contact, fetch their current online status from users collection
    const contactPromises = snapshot.docs.map(async contactDoc => {
      const contactData = contactDoc.data();

      // Fetch the actual user document to get real-time online status
      try {
        const userDoc = await getDoc(doc(db, 'users', contactDoc.id));
        const userData = userDoc.exists() ? userDoc.data() : {};

        return {
          id: contactDoc.id,
          name: contactData.name,
          email: contactData.email,
          photoUrl: contactData.photoUrl,
          online: Boolean(userData?.online), // Explicitly convert to boolean
          lastSeen: userData?.lastSeen?.toDate() || new Date(),
        };
      } catch (error) {
        console.error(`Error fetching user data for ${contactDoc.id}:`, error);
        // Return contact with offline status if user doc fetch fails
        return {
          id: contactDoc.id,
          name: contactData.name,
          email: contactData.email,
          photoUrl: contactData.photoUrl,
          online: false,
          lastSeen: contactData.lastSeen?.toDate() || new Date(),
        };
      }
    });

    const resolvedContacts = await Promise.all(contactPromises);
    callback(resolvedContacts);
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

          // Sign in to get the user ID and create Firestore doc
          try {
            const { signInWithEmailAndPassword, signOut, updateProfile } =
              await import('firebase/auth');
            const signInResult = await signInWithEmailAndPassword(
              auth,
              user.email,
              user.password
            );
            userId = signInResult.user.uid;

            // Update display name
            await updateProfile(signInResult.user, {
              displayName: user.name,
            });

            // Create/update Firestore doc WHILE AUTHENTICATED
            const db = getDb(true);
            const { setDoc, doc } = await import('firebase/firestore');
            await setDoc(
              doc(db, 'users', userId),
              {
                id: userId,
                email: user.email,
                name: user.name,
                online: true,
                lastSeen: new Date(),
                role: 'contractor',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
            console.log(
              `✅ Updated Firestore doc for existing user: ${user.email}`
            );

            // Sign out after creating doc
            await signOut(auth);
          } catch (signInError) {
            console.error(
              `Failed to process existing user ${user.email}:`,
              signInError
            );
          }
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

  // Fetch all users from Firestore to get their actual UIDs
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  console.log(`Found ${usersSnapshot.docs.length} users in Firestore`);

  const demoEmails = ['alice@demo.com', 'bob@demo.com', 'charlie@demo.com'];
  const demoUsers: Contact[] = [];

  // Find demo users by email and use their Firebase UIDs
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    console.log(`Checking user: ${userData.email} (${doc.id})`);

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
      console.log(`Added to demo users list: ${contact.name} (${contact.id})`);
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
