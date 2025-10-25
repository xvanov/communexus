// users.ts - User CRUD service
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { initializeFirebase, getDb } from './firebase';
import { User } from '../types/User';

export async function upsertCurrentUser(
  partial: Partial<User> & { name: string; email?: string }
): Promise<User> {
  const { auth } = await initializeFirebase();
  const db = await getDb();
  const current = auth.currentUser;
  if (!current) throw new Error('Not authenticated');
  const userId = current.uid;
  const ref = doc(db as any, 'users', userId);
  const now = serverTimestamp() as unknown as Date;
  const payload: Partial<User> = {
    id: userId,
    email: partial.email ?? current.email ?? '',
    name: partial.name,
    ...(partial.phone && { phone: partial.phone }),
    role: partial.role ?? 'contractor',
    ...(partial.photoUrl && { photoUrl: partial.photoUrl }),
    online: partial.online ?? true,
    lastSeen: partial.lastSeen ?? now,
    typing: partial.typing ?? null,
    ...(partial.pushToken && { pushToken: partial.pushToken }),
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };

  console.log('📝 Upserting user document:', {
    userId,
    email: payload.email,
    name: payload.name,
    payload: payload,
  });

  await setDoc(ref, payload, { merge: true });
  const snap = await getDoc(ref);
  const result = { id: userId, ...(snap.data() as any) } as User;

  console.log('✅ User document upserted successfully:', {
    id: result.id,
    email: result.email,
    name: result.name,
  });

  return result;
}

export async function getUser(userId: string): Promise<User | null> {
  const db = await getDb();
  const ref = doc(db as any, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: userId, ...(snap.data() as any) } as User;
}

export async function updateCurrentUser(partial: Partial<User>): Promise<void> {
  const { auth } = await initializeFirebase();
  const db = await getDb();
  const current = auth.currentUser;
  if (!current) throw new Error('Not authenticated');
  const ref = doc(db as any, 'users', current.uid);
  await updateDoc(ref, {
    ...partial,
    updatedAt: serverTimestamp() as unknown as Date,
  } as any);
}
