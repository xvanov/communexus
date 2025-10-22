// threads.ts - Thread CRUD service
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Thread } from '../types/Thread';

// Create a new thread
export const createThread = async (
  participants: string[],
  participantDetails: { id: string; name: string; photoUrl?: string }[],
  isGroup: boolean = false,
  groupName?: string,
  groupPhotoUrl?: string
): Promise<string> => {
  const db = getDb();
  const col = collection(db, 'threads');

  const threadData = {
    participants,
    participantDetails,
    isGroup,
    groupName: groupName || null,
    groupPhotoUrl: groupPhotoUrl || null,
    lastMessage: null,
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(col, threadData);
  return docRef.id;
};

// Get a single thread
export const getThread = async (threadId: string): Promise<Thread | null> => {
  const db = getDb();
  const threadRef = doc(db, 'threads', threadId);
  const snapshot = await getDoc(threadRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    participants: data.participants || [],
    participantDetails: data.participantDetails || [],
    isGroup: data.isGroup || false,
    groupName: data.groupName,
    groupPhotoUrl: data.groupPhotoUrl,
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
        }
      : {
          text: '',
          senderId: '',
          senderName: '',
          timestamp: new Date(),
        },
    unreadCount: data.unreadCount || {},
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// List threads for a user
export const listThreadsForUser = async (userId: string): Promise<Thread[]> => {
  const db = getDb();
  const col = collection(db, 'threads');
  const q = query(
    col,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const threads: Thread[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    threads.push({
      id: doc.id,
      participants: data.participants || [],
      participantDetails: data.participantDetails || [],
      isGroup: data.isGroup || false,
      groupName: data.groupName,
      groupPhotoUrl: data.groupPhotoUrl,
      lastMessage: data.lastMessage
        ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
          }
        : {
            text: '',
            senderId: '',
            senderName: '',
            timestamp: new Date(),
          },
      unreadCount: data.unreadCount || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return threads;
};

// Subscribe to user's threads
export const subscribeToUserThreads = (
  userId: string,
  callback: (threads: Thread[]) => void
): (() => void) => {
  const db = getDb();
  const col = collection(db, 'threads');
  const q = query(
    col,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, snapshot => {
    const threads: Thread[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      threads.push({
        id: doc.id,
        participants: data.participants || [],
        participantDetails: data.participantDetails || [],
        isGroup: data.isGroup || false,
        groupName: data.groupName,
        groupPhotoUrl: data.groupPhotoUrl,
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            }
          : {
              text: '',
              senderId: '',
              senderName: '',
              timestamp: new Date(),
            },
        unreadCount: data.unreadCount || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    callback(threads);
  });
};

// Update thread
export const updateThread = async (
  threadId: string,
  updates: Partial<Thread>
): Promise<void> => {
  const db = getDb();
  const threadRef = doc(db, 'threads', threadId);

  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(threadRef, updateData);
};

// Add participant to thread
export const addParticipantToThread = async (
  threadId: string,
  userId: string,
  userDetails: { id: string; name: string; photoUrl?: string }
): Promise<void> => {
  const thread = await getThread(threadId);
  if (!thread) {
    throw new Error('Thread not found');
  }

  const updatedParticipants = [...thread.participants, userId];
  const updatedParticipantDetails = [...thread.participantDetails, userDetails];
  const updatedUnreadCount = { ...thread.unreadCount, [userId]: 0 };

  await updateThread(threadId, {
    participants: updatedParticipants,
    participantDetails: updatedParticipantDetails,
    unreadCount: updatedUnreadCount,
  });
};

// Remove participant from thread
export const removeParticipantFromThread = async (
  threadId: string,
  userId: string
): Promise<void> => {
  const thread = await getThread(threadId);
  if (!thread) {
    throw new Error('Thread not found');
  }

  const updatedParticipants = thread.participants.filter(id => id !== userId);
  const updatedParticipantDetails = thread.participantDetails.filter(
    p => p.id !== userId
  );
  const updatedUnreadCount = { ...thread.unreadCount };
  delete updatedUnreadCount[userId];

  await updateThread(threadId, {
    participants: updatedParticipants,
    participantDetails: updatedParticipantDetails,
    unreadCount: updatedUnreadCount,
  });
};

// Update unread count for a user
export const updateUnreadCount = async (
  threadId: string,
  userId: string,
  increment: number = 1
): Promise<void> => {
  const thread = await getThread(threadId);
  if (!thread) {
    throw new Error('Thread not found');
  }

  const currentCount = thread.unreadCount[userId] || 0;
  const newCount = Math.max(0, currentCount + increment);

  await updateThread(threadId, {
    unreadCount: {
      ...thread.unreadCount,
      [userId]: newCount,
    },
  });
};

// Reset unread count for a user
export const resetUnreadCount = async (
  threadId: string,
  userId: string
): Promise<void> => {
  await updateUnreadCount(threadId, userId, 0);
};

// Find or create one-on-one thread
export const findOrCreateOneOnOneThread = async (
  userId1: string,
  userId2: string,
  user1Details: { id: string; name: string; photoUrl?: string },
  user2Details: { id: string; name: string; photoUrl?: string }
): Promise<string> => {
  const db = getDb();
  const col = collection(db, 'threads');

  // Check if thread already exists
  const q = query(
    col,
    where('participants', 'array-contains', userId1),
    where('isGroup', '==', false)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (
      data.participants.length === 2 &&
      data.participants.includes(userId1) &&
      data.participants.includes(userId2)
    ) {
      return doc.id;
    }
  }

  // Create new thread
  return await createThread(
    [userId1, userId2],
    [user1Details, user2Details],
    false
  );
};
