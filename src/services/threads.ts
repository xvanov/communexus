// threads.ts - Thread CRUD service
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { initializeFirebase } from './firebase';
import { Thread } from '../types/Thread';

export async function createThread(participants: string[], isGroup: boolean, groupName?: string): Promise<string> {
  const db = (await import('./firebase')).getDb?.(false) ?? initializeFirebase().db;
  const ref = await addDoc(collection(db as any, 'threads'), {
    participants,
    participantDetails: [],
    isGroup,
    groupName: groupName ?? null,
    lastMessage: null,
    unreadCount: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);
  return ref.id;
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const db = (await import('./firebase')).getDb?.(false) ?? initializeFirebase().db;
  const ref = doc(db as any, 'threads', threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: threadId, ...(snap.data() as any) } as Thread;
}

export async function listThreadsForUser(userId: string): Promise<Thread[]> {
  const db = (await import('./firebase')).getDb?.(false) ?? initializeFirebase().db;
  const q = query(collection(db as any, 'threads'), where('participants', 'array-contains', userId));
  const res = await getDocs(q);
  return res.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Thread[];
}

export async function updateThread(threadId: string, partial: Partial<Thread>): Promise<void> {
  const db = (await import('./firebase')).getDb?.(false) ?? initializeFirebase().db;
  await updateDoc(doc(db as any, 'threads', threadId), { ...partial, updatedAt: new Date() } as any);
}


