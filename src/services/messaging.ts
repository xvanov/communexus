// messaging.ts - Send/receive messages with Firestore real-time listeners
import { Message } from '../types/Message';
import { initializeFirebase } from './firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

export const sendMessage = async (message: Message) => {
  const { db } = initializeFirebase();
  const col = collection(db, `threads/${message.threadId}/messages`);
  await addDoc(col, {
    ...message,
    createdAt: message.createdAt ?? (serverTimestamp() as unknown as Date),
  });
};

export const subscribeToMessages = (
  threadId: string,
  callback: (messages: Message[]) => void
) => {
  const { db } = initializeFirebase();
  const col = collection(db, `threads/${threadId}/messages`);
  const q = query(col, orderBy('timestamp', 'desc') as any);
  return onSnapshot(q, snap => {
    const items: Message[] = [] as any;
    snap.forEach(doc => items.push({ id: doc.id, ...(doc.data() as any) }));
    callback(items);
  });
};
