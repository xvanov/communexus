// useAuth.ts - Authentication state hook
import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
