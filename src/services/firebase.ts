// firebase.ts - Firebase initialization and configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  connectAuthEmulator,
  Auth,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  FirebaseStorage,
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator,
  Functions,
} from 'firebase/functions';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functionsClient: Functions | null = null;

function getEnvFlag(name: string, defaultValue = false): boolean {
  const v = process.env[name];
  if (v === undefined) return defaultValue;
  return v === '1' || v === 'true' || v === 'yes';
}

function getEmulatorHost(): string {
  return (
    process.env.EXPO_PUBLIC_EMULATOR_HOST ||
    process.env.EMULATOR_HOST ||
    '127.0.0.1'
  );
}

export const initializeFirebase = (
  config?: Partial<{ useEmulator: boolean }>
) => {
  if (!app) {
    try {
      app =
        getApps()[0] ||
        initializeApp({
          apiKey:
            process.env.FIREBASE_API_KEY || 'AIzaSyC-fake-key-for-emulator',
          authDomain:
            process.env.FIREBASE_AUTH_DOMAIN ||
            'demo-communexus.firebaseapp.com',
          projectId: process.env.FIREBASE_PROJECT_ID || 'demo-communexus',
          storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ||
            'demo-communexus.appspot.com',
          appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
        });
      // Initialize Auth with platform-specific persistence
      if (Platform.OS === 'web') {
        // For web, use regular getAuth
        auth = getAuth(app);
      } else {
        // For React Native, use initializeAuth without persistence (Firebase handles this automatically)
        try {
          auth = initializeAuth(app);
        } catch (error) {
          console.log('initializeAuth failed, using getAuth:', error);
          // Fallback to regular auth if initializeAuth fails
          auth = getAuth(app);
        }
      }

      const useEmulator =
        config?.useEmulator ?? getEnvFlag('EXPO_PUBLIC_USE_EMULATORS', true); // Default to true for development
      if (useEmulator) {
        const host = getEmulatorHost();
        try {
          connectAuthEmulator(auth, `http://${host}:9099`, {
            disableWarnings: true,
          });
        } catch (connectError) {
          // Silently fail emulator connection in tests
          console.log('Auth emulator connection skipped:', connectError);
        }
      }
    } catch (firebaseError) {
      // Catch any Firebase initialization errors and log them instead of throwing
      console.error('Firebase initialization error:', firebaseError);
      // Continue with existing app if initialization fails
      if (!app && getApps().length > 0) {
        app = getApps()[0] || null;
      }
      if (!auth && app) {
        auth = getAuth(app);
      }
    }
  }
  return { app: app as FirebaseApp, auth: auth as Auth };
};

export const getDb = (
  useEmulator = getEnvFlag('EXPO_PUBLIC_USE_EMULATORS', true)
): Firestore => {
  if (!app) initializeFirebase({ useEmulator });
  if (!db) {
    db = getFirestore(app as FirebaseApp);
    if (useEmulator) {
      try {
        connectFirestoreEmulator(db, getEmulatorHost(), 8080);
      } catch {}
    }
  }
  return db as Firestore;
};

export const getBucket = (
  useEmulator = getEnvFlag('EXPO_PUBLIC_USE_EMULATORS', true)
): FirebaseStorage => {
  if (!app) initializeFirebase({ useEmulator });
  if (!storage) {
    storage = getStorage(app as FirebaseApp);
    if (useEmulator) {
      try {
        connectStorageEmulator(storage, getEmulatorHost(), 9199);
      } catch {}
    }
  }
  return storage as FirebaseStorage;
};

export const getFunctionsClient = (
  useEmulator = getEnvFlag('EXPO_PUBLIC_USE_EMULATORS', true)
): Functions => {
  if (!app) initializeFirebase({ useEmulator });
  if (!functionsClient) {
    functionsClient = getFunctions(app as FirebaseApp);
    if (useEmulator) {
      try {
        connectFunctionsEmulator(functionsClient, getEmulatorHost(), 5001);
      } catch {}
    }
  }
  return functionsClient as Functions;
};
