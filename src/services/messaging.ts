// messaging.ts - Send/receive messages with Firestore real-time listeners
import { Message } from '../types/Message';
import { Thread } from '../types/Thread';
import { getDb } from './firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  limit,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

// Message status types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

// Optimistic message creation for immediate UI feedback
export const createOptimisticMessage = (
  threadId: string,
  senderId: string,
  senderName: string,
  text: string,
  senderPhotoUrl?: string
): Message => {
  const now = new Date();
  return {
    id: `temp_${Date.now()}_${Math.random()}`,
    threadId,
    senderId,
    senderName,
    ...(senderPhotoUrl && { senderPhotoUrl }),
    text,
    status: 'sending',
    deliveredTo: [],
    readBy: [],
    readTimestamps: {},
    createdAt: now,
  };
};

// Send message with optimistic updates
export const sendMessage = async (message: Message): Promise<string> => {
  const db = getDb();
  const col = collection(db, `threads/${message.threadId}/messages`);

  try {
    console.log('💾 Saving message to Firestore:', {
      threadId: message.threadId,
      senderName: message.senderName,
      text: message.text.substring(0, 30) + '...',
      timestamp: message.createdAt.toLocaleTimeString(),
    });

    const docRef = await addDoc(col, {
      threadId: message.threadId,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      status: message.status,
      deliveredTo: message.deliveredTo,
      readBy: message.readBy,
      readTimestamps: message.readTimestamps,
      createdAt: serverTimestamp(),
      sentAt: serverTimestamp(),
      // Only include optional fields if they have values
      ...(message.senderPhotoUrl && { senderPhotoUrl: message.senderPhotoUrl }),
      ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
      ...(message.mediaType && { mediaType: message.mediaType }),
      ...(message.priority && { priority: message.priority }),
      ...(message.isDecision !== undefined && {
        isDecision: message.isDecision,
      }),
      ...(message.deleted !== undefined && { deleted: message.deleted }),
    });

    console.log('✅ Message saved with ID:', docRef.id);
    console.log('🔥 Message saved - Cloud Function should trigger now');

    // Update thread's last message
    await updateThreadLastMessage(message.threadId, {
      text: message.text,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: new Date(),
    });

    console.log('✅ Thread last message updated successfully');
    console.log(
      '🔥 All updates complete - Cloud Function should have triggered'
    );

    return docRef.id;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Update message status
export const updateMessageStatus = async (
  threadId: string,
  messageId: string,
  status: MessageStatus,
  userId?: string
): Promise<void> => {
  const db = getDb();
  const messageRef = doc(db, `threads/${threadId}/messages`, messageId);

  const updateData: any = { status };

  if (status === 'delivered' && userId) {
    updateData.deliveredTo = [userId];
    updateData.deliveredAt = serverTimestamp();
  } else if (status === 'read' && userId) {
    updateData.readBy = [userId];
    updateData.readTimestamps = { [userId]: serverTimestamp() };
  }

  await updateDoc(messageRef, updateData);
};

// Subscribe to messages with real-time updates
export const subscribeToMessages = (
  threadId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
): (() => void) => {
  const db = getDb();
  const col = collection(db, `threads/${threadId}/messages`);
  const q = query(col, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    snapshot => {
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

      // Sort by creation time (oldest first for display)
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(messages);
    },
    error => {
      // Handle errors gracefully - call callback with empty array to stop loading
      console.error('Error subscribing to messages:', error);
      callback([]);
    }
  );
};

// Subscribe to thread updates
export const subscribeToThread = (
  threadId: string,
  callback: (thread: Thread | null) => void
): (() => void) => {
  const db = getDb();
  const threadRef = doc(db, 'threads', threadId);

  return onSnapshot(threadRef, snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
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
      });
    } else {
      callback(null);
    }
  });
};

// Update thread's last message
const updateThreadLastMessage = async (
  threadId: string,
  lastMessage: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  }
): Promise<void> => {
  const db = getDb();
  const threadRef = doc(db, 'threads', threadId);

  console.log('🔄 Updating thread last message:', {
    threadId,
    senderName: lastMessage.senderName,
    text: lastMessage.text.substring(0, 30) + '...',
    timestamp: lastMessage.timestamp.toLocaleTimeString(),
  });

  await updateDoc(threadRef, {
    lastMessage: {
      ...lastMessage,
      timestamp: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  console.log('✅ Thread last message updated successfully');
};

// Mark messages as read
export const markMessagesAsRead = async (
  threadId: string,
  userId: string,
  messageIds: string[]
): Promise<void> => {
  const db = getDb();
  const batch = [];

  for (const messageId of messageIds) {
    const messageRef = doc(db, `threads/${threadId}/messages`, messageId);
    batch.push(
      updateDoc(messageRef, {
        readBy: [userId],
        readTimestamps: { [userId]: serverTimestamp() },
        status: 'read',
      })
    );
  }

  await Promise.all(batch);
};

// Search messages in a thread
export const searchMessages = async (
  threadId: string,
  searchText: string,
  limitCount: number = 20
): Promise<Message[]> => {
  const db = getDb();
  const col = collection(db, `threads/${threadId}/messages`);

  // Note: This is a basic text search. For semantic search, we'll use AI features later
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

// Delete message (soft delete)
export const deleteMessage = async (
  threadId: string,
  messageId: string
): Promise<void> => {
  const db = getDb();
  const messageRef = doc(db, `threads/${threadId}/messages`, messageId);

  await updateDoc(messageRef, {
    deleted: true,
    text: '[Message deleted]',
    updatedAt: serverTimestamp(),
  });
};
