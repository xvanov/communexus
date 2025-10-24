// useAuth.ts - Authentication state hook
import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        // Initialize Firebase first - this ensures all services are ready
        await initializeFirebase();
        
        const { auth } = await initializeFirebase();
        
        unsubscribe = onAuthStateChanged(auth, firebaseUser => {
          console.log(
            'Auth state changed:',
            firebaseUser ? firebaseUser.email : 'No user'
          );
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { user, loading };
};
