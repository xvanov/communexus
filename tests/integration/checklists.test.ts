// tests/integration/checklists.test.ts
// Integration tests for Checklist functionality
// Tests AC 10: Thread integration verification

import {
  createChecklist,
  getChecklist,
  updateChecklist,
  createChecklistItem,
  updateChecklistItem,
  markItemComplete,
  getChecklistsByThread,
  calculateProgress,
} from '../../src/services/checklistService';
import { initializeFirebase, getDb } from '../../src/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Note: This test requires Firebase emulators to be running
// Run with: npm run test:emul -- tests/integration/checklists.test.ts

// Test data
const TEST_USER_EMAIL = 'test@checklists.com';
const TEST_USER_PASSWORD = 'testpass123';
const TEST_THREAD_ID = 'test-thread-checklists';
const TEST_USER_2_EMAIL = 'test2@checklists.com';
const TEST_USER_2_PASSWORD = 'testpass123';

describe('Checklists Integration Tests (AC 10: Thread Integration)', () => {
  let testUserId: string;
  let testUser2Id: string;
  let db: any;
  let auth: any;

  beforeAll(async () => {
    // Increase timeout for setup
    jest.setTimeout(30000);

    // Initialize Firebase (this will connect to emulators if running)
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
        // Sign out user 1, sign in user 2
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

    // Create a test thread that user 1 participates in
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
      groupName: null,
      groupPhotoUrl: null,
      lastMessage: {
        text: 'Test message',
        senderId: testUserId,
        senderName: 'Test User',
        timestamp: new Date(),
      },
      unreadCount: { [testUserId]: 0 },
      channelSources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test thread and checklists
    try {
      const threadRef = doc(db, 'threads', TEST_THREAD_ID);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        // Get all checklists for this thread and delete them
        const checklists = await getChecklistsByThread(TEST_THREAD_ID);
        for (const checklist of checklists) {
          const checklistRef = doc(db, 'checklists', checklist.id);
          await checklistRef.delete();
        }
        await threadRef.delete();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('AC 10: Thread Integration Verification', () => {
    test('should create checklist linked to threadId', async () => {
      // Given: A user is authenticated and a thread exists
      // When: Creating a checklist for that thread
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Test Checklist',
        testUserId
      );

      // Then: Checklist should be created with correct threadId
      expect(checklist).toBeDefined();
      expect(checklist.threadId).toBe(TEST_THREAD_ID);
      expect(checklist.title).toBe('Test Checklist');
      expect(checklist.createdBy).toBe(testUserId);
      expect(checklist.items).toEqual([]);
    });

    test('should retrieve checklists by threadId', async () => {
      // Given: Multiple checklists exist for a thread
      await createChecklist(TEST_THREAD_ID, 'Checklist 1', testUserId);
      await createChecklist(TEST_THREAD_ID, 'Checklist 2', testUserId);

      // When: Getting checklists for the thread
      const checklists = await getChecklistsByThread(TEST_THREAD_ID);

      // Then: All checklists for that thread should be returned
      expect(checklists.length).toBeGreaterThanOrEqual(2);
      checklists.forEach(checklist => {
        expect(checklist.threadId).toBe(TEST_THREAD_ID);
      });
    });

    test('should not retrieve checklists from other threads', async () => {
      // Given: A checklist exists in a different thread
      const otherThreadId = 'other-thread-id';
      const otherThreadRef = doc(db, 'threads', otherThreadId);
      await setDoc(otherThreadRef, {
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

      await createChecklist(otherThreadId, 'Other Thread Checklist', testUserId);

      // When: Getting checklists for the original thread
      const checklists = await getChecklistsByThread(TEST_THREAD_ID);

      // Then: Checklists from other thread should not be included
      checklists.forEach(checklist => {
        expect(checklist.threadId).toBe(TEST_THREAD_ID);
        expect(checklist.threadId).not.toBe(otherThreadId);
      });

      // Cleanup
      await otherThreadRef.delete();
    });
  });

  describe('AC 9: End-to-End Operations', () => {
    test('should complete full workflow: create → view → update → complete', async () => {
      // Given: A new checklist
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'E2E Test Checklist',
        testUserId
      );

      // When: Creating items
      const item1 = await createChecklistItem(checklist.id, {
        checklistId: checklist.id,
        title: 'Item 1',
        status: 'pending',
        order: 0,
      });
      const item2 = await createChecklistItem(checklist.id, {
        checklistId: checklist.id,
        title: 'Item 2',
        status: 'pending',
        order: 1,
      });

      // Then: Items should be created
      expect(item1).toBeDefined();
      expect(item2).toBeDefined();

      // When: Viewing the checklist
      const viewed = await getChecklist(checklist.id);

      // Then: Checklist should contain the items
      expect(viewed).toBeDefined();
      expect(viewed?.items.length).toBe(2);

      // When: Updating an item
      const updatedItem = await updateChecklistItem(checklist.id, item1.id, {
        title: 'Updated Item 1',
      });

      // Then: Item should be updated
      expect(updatedItem.title).toBe('Updated Item 1');

      // When: Marking item as complete
      const completedItem = await markItemComplete(checklist.id, item2.id, testUserId);

      // Then: Item should be marked as completed
      expect(completedItem.status).toBe('completed');
      expect(completedItem.completedAt).toBeDefined();
      expect(completedItem.completedBy).toBe(testUserId);

      // When: Calculating progress
      const progress = await calculateProgress(checklist.id);

      // Then: Progress should reflect completion
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBe(50);
    });
  });

  describe('Security Rules Integration (Task 2.4)', () => {
    test('should allow access for thread participants', async () => {
      // Given: A checklist exists in a thread where user is a participant
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Security Test Checklist',
        testUserId
      );

      // When: User tries to read the checklist
      const retrieved = await getChecklist(checklist.id);

      // Then: Checklist should be accessible
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(checklist.id);
    });

    test('should prevent access for non-participants', async () => {
      // Given: A checklist exists in a thread
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Private Checklist',
        testUserId
      );

      // When: User 2 (non-participant) tries to access the checklist
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then: Access should be denied by security rules
      // Note: This will fail at the Firestore security rules level
      // We expect an error when trying to access
      await expect(getChecklist(checklist.id)).rejects.toThrow();

      // Cleanup: Sign back in as user 1
      await auth.signOut();
      await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });
});


