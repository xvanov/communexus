// firebase.ts - Firebase initialization and configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  connectAuthEmulator,
  Auth,
  getAuth,
} from 'firebase/auth';
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
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;
let functionsEmulatorConnected = false;

function getEnvFlag(name: string, defaultValue = false): boolean {
  const v = process.env[name];
  if (v === undefined) return defaultValue;
  return v === '1' || v === 'true' || v === 'yes';
}

// Check if running on a real device (not simulator)
function isRealDevice(): boolean {
  // For development with emulators, always use localhost
  // In production/TestFlight, this would need to be more sophisticated
  return false;
}

function getEmulatorHost(): string {
  // For iOS Simulator, always use localhost
  // Network IPs don't work from within the simulator
  if (Platform.OS === 'ios') {
    return '127.0.0.1';
  }

  return (
    process.env.EXPO_PUBLIC_EMULATOR_HOST ||
    process.env.EMULATOR_HOST ||
    '127.0.0.1'
  );
}

// Check if emulators are running by attempting a connection
async function checkEmulatorsRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:4000`);
    return response.ok;
  } catch {
    return false;
  }
}

export const initializeFirebase = async (
  config?: Partial<{ useEmulator: boolean }>
) => {
  // If already initialized, return immediately
  if (isInitialized && app && auth) {
    return { app, auth };
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    await initializationPromise;
    return { app: app as FirebaseApp, auth: auth as Auth };
  }

  // Start initialization
  initializationPromise = performInitialization(config);
  await initializationPromise;

  return { app: app as FirebaseApp, auth: auth as Auth };
};

const performInitialization = async (
  config?: Partial<{ useEmulator: boolean }>
): Promise<void> => {
  try {
    // Check if emulators are actually running
    const emulatorsRunning = await checkEmulatorsRunning();
    const forceEmulators = getEnvFlag('EXPO_PUBLIC_FORCE_EMULATORS', false);
    // If useEmulator is explicitly set to true, always use emulator regardless of check
    const shouldUseEmulator =
      config?.useEmulator === true
        ? true
        : config?.useEmulator === false
          ? false
          : forceEmulators ||
            (emulatorsRunning
              ? true
              : isRealDevice()
                ? false
                : getEnvFlag('EXPO_PUBLIC_USE_EMULATORS', true));

    // If explicitly using emulator, assume they're running (for tests)
    // This allows tests to force emulator connection even if check fails
    const shouldConnectEmulator =
      shouldUseEmulator && (config?.useEmulator === true || emulatorsRunning);

    console.log('🔥 Firebase config:', {
      platform: Platform.OS,
      isRealDevice: isRealDevice(),
      emulatorsRunning,
      forceEmulators,
      shouldUseEmulator,
      host: getEmulatorHost(),
    });

    if (shouldUseEmulator) {
      console.log('📡 WILL CONNECT TO EMULATORS');
    } else {
      console.log('☁️ WILL USE PRODUCTION FIREBASE');
    }

    // Determine if we're in Node.js/test environment
    const isNodeEnv = typeof process !== 'undefined' && process.versions?.node;
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      process.env.JEST_WORKER_ID !== undefined;

    app =
      getApps()[0] ||
      initializeApp({
        apiKey: shouldUseEmulator
          ? 'fake-api-key-for-emulator'
          : process.env.FIREBASE_API_KEY || 'AIzaSyC-fake-key-for-emulator',
        authDomain: shouldUseEmulator
          ? 'localhost'
          : process.env.FIREBASE_AUTH_DOMAIN ||
            'demo-communexus.firebaseapp.com',
        projectId: shouldUseEmulator
          ? 'demo-communexus'
          : process.env.FIREBASE_PROJECT_ID || 'demo-communexus',
        storageBucket: shouldUseEmulator
          ? 'demo-communexus.appspot.com'
          : process.env.FIREBASE_STORAGE_BUCKET ||
            'demo-communexus.appspot.com',
        appId: shouldUseEmulator
          ? '1:123456789:web:abcdef123456'
          : process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
      });

    // Initialize Auth with platform-specific persistence
    // In Node.js/test environment, always use getAuth
    if (isNodeEnv || isTestEnv || Platform.OS === 'web') {
      // For web/Node.js/test, use regular getAuth
      auth = getAuth(app);
    } else {
      // For React Native, use initializeAuth
      // Note: AsyncStorage persistence warning is expected in development
      // Auth state persists in production builds
      try {
        auth = initializeAuth(app);
      } catch (error) {
        console.log('initializeAuth failed, using getAuth:', error);
        // Fallback to regular auth if initializeAuth fails
        auth = getAuth(app);
      }
    }

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Storage
    storage = getStorage(app);

    // Initialize Functions
    functionsClient = getFunctions(app);

    // Connect to emulators if needed - MUST connect Auth emulator BEFORE any auth operations
    if (shouldConnectEmulator) {
      const host = getEmulatorHost();

      // CRITICAL: Connect Auth emulator FIRST, before any auth operations
      try {
        // Check if already connected to avoid "already-in-use" error
        if (!(auth as any)._delegate?._config?.emulator) {
          connectAuthEmulator(auth, `http://${host}:9099`, {
            disableWarnings: true,
          });
          console.log('✅ Connected to Auth emulator');
        }
      } catch (connectError: any) {
        // If already connected, that's fine
        if (
          connectError?.message?.includes('already') ||
          connectError?.code === 'auth/emulator-config-failed'
        ) {
          console.log('ℹ️  Auth emulator already connected');
        } else {
          console.log('Auth emulator connection skipped:', connectError);
        }
      }

      try {
        connectFirestoreEmulator(db, host, 8080);
        console.log('✅ Connected to Firestore emulator');
      } catch (connectError) {
        console.log('Firestore emulator connection skipped:', connectError);
      }

      try {
        connectStorageEmulator(storage, host, 9199);
        console.log('✅ Connected to Storage emulator');
      } catch (connectError) {
        console.log('Storage emulator connection skipped:', connectError);
      }

      try {
        connectFunctionsEmulator(functionsClient, host, 5001);
        functionsEmulatorConnected = true;
        console.log('✅ Connected to Functions emulator at', `${host}:5001`);
      } catch (connectError) {
        console.error('❌ Functions emulator connection FAILED:', connectError);
      }
    }

    isInitialized = true;
    console.log('✅ Firebase initialization complete');
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
    if (!db && app) {
      db = getFirestore(app);
    }
    if (!storage && app) {
      storage = getStorage(app);
    }
    if (!functionsClient && app) {
      functionsClient = getFunctions(app);
    }
    isInitialized = true;
  }
};

export const getDb = async (): Promise<Firestore> => {
  if (!isInitialized) {
    await initializeFirebase();
  }
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

export const getBucket = async (): Promise<FirebaseStorage> => {
  if (!isInitialized) {
    await initializeFirebase();
  }
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  return storage;
};

export const getFunctionsClient = async (): Promise<Functions> => {
  if (!isInitialized) {
    await initializeFirebase();
  }
  if (!functionsClient) {
    throw new Error('Functions not initialized');
  }

  // FORCE emulator connection for development if not already connected
  if (__DEV__ && !functionsEmulatorConnected) {
    try {
      console.log(
        '⚠️ Functions NOT connected to emulator during init, connecting now...'
      );
      connectFunctionsEmulator(functionsClient, '127.0.0.1', 5001);
      functionsEmulatorConnected = true;
      console.log(
        '✅ Forcefully connected Functions to emulator at 127.0.0.1:5001'
      );
    } catch (e) {
      console.error('❌ Failed to connect to Functions emulator:', e);
    }
  } else if (functionsEmulatorConnected) {
    console.log('✅ Functions emulator connection verified');
  }

  return functionsClient;
};
