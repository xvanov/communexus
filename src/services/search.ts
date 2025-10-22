// search.ts - Message search functionality
import { getDb } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { Message } from '../types/Message';
import { Thread } from '../types/Thread';

// Search messages across all threads for a user
export const searchMessages = async (
  userId: string,
  searchText: string,
  limitCount: number = 20
): Promise<Message[]> => {
  const db = getDb();

  // Get all threads for the user first
  const threadsCol = collection(db, 'threads');
  const threadsQuery = query(
    threadsCol,
    where('participants', 'array-contains', userId)
  );

  const threadsSnapshot = await getDocs(threadsQuery);
  const threadIds = threadsSnapshot.docs.map(doc => doc.id);

  if (threadIds.length === 0) {
    return [];
  }

  const allMessages: Message[] = [];

  // Search in each thread
  for (const threadId of threadIds) {
    const messagesCol = collection(db, `threads/${threadId}/messages`);
    const messagesQuery = query(
      messagesCol,
      where('text', '>=', searchText),
      where('text', '<=', searchText + '\uf8ff'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    try {
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        allMessages.push({
          id: doc.id,
          threadId: data.threadId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhotoUrl: data.senderPhotoUrl,
          text: data.text,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          status: data.status || 'sent',
          deliveredTo: data.deliveredTo || [],
          readBy: data.readBy || [],
          readTimestamps: data.readTimestamps || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          sentAt: data.sentAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          priority: data.priority,
          isDecision: data.isDecision || false,
          deleted: data.deleted || false,
        });
      });
    } catch (error) {
      console.error(`Error searching in thread ${threadId}:`, error);
    }
  }

  // Sort by creation time (newest first)
  allMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Return limited results
  return allMessages.slice(0, limitCount);
};

// Search messages in a specific thread
export const searchMessagesInThread = async (
  threadId: string,
  searchText: string,
  limitCount: number = 20
): Promise<Message[]> => {
  const db = getDb();
  const col = collection(db, `threads/${threadId}/messages`);

  const q = query(
    col,
    where('text', '>=', searchText),
    where('text', '<=', searchText + '\uf8ff'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const messages: Message[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      threadId: data.threadId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderPhotoUrl: data.senderPhotoUrl,
      text: data.text,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      status: data.status || 'sent',
      deliveredTo: data.deliveredTo || [],
      readBy: data.readBy || [],
      readTimestamps: data.readTimestamps || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      sentAt: data.sentAt?.toDate(),
      deliveredAt: data.deliveredAt?.toDate(),
      priority: data.priority,
      isDecision: data.isDecision || false,
      deleted: data.deleted || false,
    });
  });

  return messages;
};

// Search threads by name or participants
export const searchThreads = async (
  userId: string,
  searchText: string,
  limitCount: number = 10
): Promise<Thread[]> => {
  const db = getDb();
  const col = collection(db, 'threads');

  // Search by group name
  const groupNameQuery = query(
    col,
    where('participants', 'array-contains', userId),
    where('groupName', '>=', searchText),
    where('groupName', '<=', searchText + '\uf8ff'),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(groupNameQuery);
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

// Highlight search terms in text
export const highlightSearchTerms = (
  text: string,
  searchText: string
): string => {
  if (!searchText.trim()) return text;

  const regex = new RegExp(`(${searchText})`, 'gi');
  return text.replace(regex, '**$1**');
};

// Get search suggestions based on recent messages
export const getSearchSuggestions = async (
  userId: string,
  limitCount: number = 5
): Promise<string[]> => {
  const db = getDb();

  // Get recent messages to extract common words
  const threadsCol = collection(db, 'threads');
  const threadsQuery = query(
    threadsCol,
    where('participants', 'array-contains', userId)
  );

  const threadsSnapshot = await getDocs(threadsQuery);
  const threadIds = threadsSnapshot.docs.map(doc => doc.id);

  const suggestions: Set<string> = new Set();

  for (const threadId of threadIds.slice(0, 3)) {
    // Limit to first 3 threads for performance
    const messagesCol = collection(db, `threads/${threadId}/messages`);
    const messagesQuery = query(
      messagesCol,
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    try {
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        const text = data.text || '';

        // Extract words (simple approach)
        const words = text
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .filter((word: string) => !/^[0-9]+$/.test(word))
          .slice(0, 3); // Take first 3 words

        words.forEach((word: string) => suggestions.add(word));
      });
    } catch (error) {
      console.error(
        `Error getting suggestions from thread ${threadId}:`,
        error
      );
    }
  }

  return Array.from(suggestions).slice(0, limitCount);
};
