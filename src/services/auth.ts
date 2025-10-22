// auth.ts - Firebase Authentication methods
import { initializeFirebase } from './firebase';
import { signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential['user']> => {
  const { auth } = initializeFirebase();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signOutUser = async (): Promise<void> => {
  const { auth } = initializeFirebase();
  await signOut(auth);
};

// Simplest placeholder for Google sign-in: not implemented in tests; returns rejected promise if used without platform setup
export const signInWithGoogle = async () => {
  throw new Error('Google sign-in not configured for this environment');
};
