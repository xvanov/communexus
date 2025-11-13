// tests/integration/checklist_security_rules.test.ts
// Integration tests for Checklist security rules (Task 2.4)
// Tests Firestore security rules for checklists collection

import { initializeFirebase, getDb } from '../../src/services/firebase';
import {
  setupEmulator,
  withAuthedUser,
} from '../utils/testEnv';
import {
  createChecklist,
  getChecklist,
  updateChecklist,
} from '../../src/services/checklistService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Note: This test requires Firebase emulators to be running
// Run with: npm run test:emul -- tests/integration/checklist_security_rules.test.ts

const TEST_USER_EMAIL = 'test-security@checklists.com';
const TEST_USER_PASSWORD = 'testpass123';
const TEST_USER_2_EMAIL = 'test-security2@checklists.com';
const TEST_USER_2_PASSWORD = 'testpass123';
const TEST_THREAD_ID = 'test-thread-security';

describe('Checklist Security Rules Integration Tests (Task 2.4)', () => {
  let testEnv: any;
  let testUserId: string;
  let testUser2Id: string;
  let db: any;
  let auth: any;

  beforeAll(async () => {
    jest.setTimeout(30000);

    // Setup emulator test environment
    testEnv = await setupEmulator();

    // Initialize Firebase
    const { auth: authInstance } = await initializeFirebase({
      useEmulator: true,
    });
    auth = authInstance;
    db = await getDb();

    // Create test user 1
    try {
      await createUserWithEmailAndPassword(
        auth,
        TEST_USER_EMAIL,
        TEST_USER_PASSWORD
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(
          auth,
          TEST_USER_EMAIL,
          TEST_USER_PASSWORD
        );
      } else {
        throw error;
      }
    }

    let user = auth.currentUser;
    let retries = 0;
    while (!user && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      user = auth.currentUser;
      retries++;
    }
    if (!user) {
      throw new Error('Failed to authenticate test user');
    }
    testUserId = user.uid;

    // Create test user 2
    try {
      await createUserWithEmailAndPassword(
        auth,
        TEST_USER_2_EMAIL,
        TEST_USER_2_PASSWORD
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        await auth.signOut();
        await signInWithEmailAndPassword(
          auth,
          TEST_USER_2_EMAIL,
          TEST_USER_2_PASSWORD
        );
      } else {
        throw error;
      }
    }

    user = auth.currentUser;
    retries = 0;
    while (!user && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      user = auth.currentUser;
      retries++;
    }
    if (!user) {
      throw new Error('Failed to authenticate test user 2');
    }
    testUser2Id = user.uid;

    // Sign back in as user 1
    await auth.signOut();
    await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create test thread
    const threadRef = doc(db, 'threads', TEST_THREAD_ID);
    await setDoc(threadRef, {
      participants: [testUserId],
      participantDetails: [
        {
          id: testUserId,
          name: 'Test User',
          email: TEST_USER_EMAIL,
        },
      ],
      isGroup: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      const threadRef = doc(db, 'threads', TEST_THREAD_ID);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        await threadRef.delete();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe('Security Rules: Read Access', () => {
    test('should allow read for thread participants', async () => {
      // Given: A checklist exists in a thread where user is a participant
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Security Test Checklist',
        testUserId
      );

      // When: Participant tries to read
      const retrieved = await getChecklist(checklist.id);

      // Then: Read should succeed
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(checklist.id);
    });

    test('should deny read for non-participants', async () => {
      // Given: A checklist exists in a thread
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Private Checklist',
        testUserId
      );

      // When: Non-participant tries to read
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then: Read should be denied
      await expect(getChecklist(checklist.id)).rejects.toThrow();

      // Cleanup
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });

  describe('Security Rules: Write Access', () => {
    test('should allow create for thread participants', async () => {
      // Given: User is a thread participant
      // When: Creating a checklist
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'New Checklist',
        testUserId
      );

      // Then: Create should succeed
      expect(checklist).toBeDefined();
      expect(checklist.threadId).toBe(TEST_THREAD_ID);
    });

    test('should deny create for non-participants', async () => {
      // Given: User is not a thread participant
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));

      // When: Non-participant tries to create checklist
      // Then: Create should be denied
      await expect(
        createChecklist(TEST_THREAD_ID, 'Unauthorized Checklist', testUser2Id)
      ).rejects.toThrow();

      // Cleanup
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    test('should allow update for thread participants', async () => {
      // Given: A checklist exists
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Update Test Checklist',
        testUserId
      );

      // When: Participant updates the checklist
      const updated = await updateChecklist(checklist.id, {
        title: 'Updated Title',
      });

      // Then: Update should succeed
      expect(updated.title).toBe('Updated Title');
    });

    test('should deny update for non-participants', async () => {
      // Given: A checklist exists
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Protected Checklist',
        testUserId
      );

      // When: Non-participant tries to update
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then: Update should be denied
      await expect(
        updateChecklist(checklist.id, { title: 'Hacked Title' })
      ).rejects.toThrow();

      // Cleanup
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });
});


