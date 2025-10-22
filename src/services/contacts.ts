// contacts.ts - Service for managing user contacts and online status
import { getDb } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
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
export const addContact = async (userId: string, contact: Contact): Promise<void> => {
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
  snapshot.forEach((doc) => {
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
  
  return onSnapshot(contactsRef, (snapshot) => {
    const contacts: Contact[] = [];
    snapshot.forEach((doc) => {
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
    callback(contacts);
  });
};

// Update user's online status
export const updateUserOnlineStatus = async (userId: string, online: boolean): Promise<void> => {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  
  // Use setDoc with merge to create or update the user document
  await setDoc(userRef, {
    online,
    lastSeen: new Date(),
  }, { merge: true });
  
  // Also update in all contact lists
  const contactsRef = collection(db, 'users', userId, 'contacts');
  const snapshot = await getDocs(contactsRef);
  
  const updatePromises = snapshot.docs.map((contactDoc) => {
    const contactRef = doc(db, 'users', contactDoc.id, 'contacts', userId);
    return setDoc(contactRef, {
      online,
      lastSeen: new Date(),
    }, { merge: true });
  });
  
  await Promise.all(updatePromises);
};

// Initialize test users as contacts for each other
export const initializeTestUserContacts = async (currentUserId: string): Promise<void> => {
  const testUsers = [
    {
      id: 'a@test.com',
      name: 'User A',
      email: 'a@test.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'b@test.com',
      name: 'User B', 
      email: 'b@test.com',
      online: false,
      lastSeen: new Date(),
    },
    {
      id: 'demo@communexus.com',
      name: 'Demo User',
      email: 'demo@communexus.com',
      online: false,
      lastSeen: new Date(),
    },
  ];

  // Only add contacts for the current authenticated user
  for (const contact of testUsers) {
    if (contact.id !== currentUserId) {
      await addContact(currentUserId, contact);
    }
  }
};
