// tests/integration/checklist_e2e_workflow.test.ts
// End-to-end integration tests for Checklist workflow (Task 9, AC 9)
// Tests full create → view → update → complete flow

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
import { doc, setDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Note: This test requires Firebase emulators to be running
// Run with: npm run test:emul -- tests/integration/checklist_e2e_workflow.test.ts

const TEST_USER_EMAIL = 'test-e2e@checklists.com';
const TEST_USER_PASSWORD = 'testpass123';
const TEST_THREAD_ID = 'test-thread-e2e';

describe('Checklist E2E Workflow Tests (Task 9, AC 9)', () => {
  let testUserId: string;
  let db: any;
  let auth: any;

  beforeAll(async () => {
    jest.setTimeout(30000);

    const { auth: authInstance } = await initializeFirebase({
      useEmulator: true,
    });
    auth = authInstance;
    db = await getDb();

    // Create test user
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
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('AC 9: Full End-to-End Workflow', () => {
    test('[P0] should complete full workflow: create → view → update → complete items', async () => {
      // Given: User wants to create a checklist
      // When: Creating a new checklist
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'E2E Test Checklist',
        testUserId
      );

      // Then: Checklist should be created
      expect(checklist).toBeDefined();
      expect(checklist.id).toBeDefined();
      expect(checklist.threadId).toBe(TEST_THREAD_ID);
      expect(checklist.title).toBe('E2E Test Checklist');
      expect(checklist.items).toEqual([]);

      // When: Adding items to the checklist
      const item1 = await createChecklistItem(checklist.id, {
        checklistId: checklist.id,
        title: 'First Task',
        status: 'pending',
        order: 0,
      });
      const item2 = await createChecklistItem(checklist.id, {
        checklistId: checklist.id,
        title: 'Second Task',
        status: 'pending',
        order: 1,
      });
      const item3 = await createChecklistItem(checklist.id, {
        checklistId: checklist.id,
        title: 'Third Task',
        status: 'pending',
        order: 2,
      });

      // Then: Items should be created
      expect(item1).toBeDefined();
      expect(item2).toBeDefined();
      expect(item3).toBeDefined();
      expect(item1.title).toBe('First Task');
      expect(item2.title).toBe('Second Task');
      expect(item3.title).toBe('Third Task');

      // When: Viewing the checklist
      const viewedChecklist = await getChecklist(checklist.id);

      // Then: Checklist should show all items
      expect(viewedChecklist).toBeDefined();
      expect(viewedChecklist?.items.length).toBe(3);
      expect(viewedChecklist?.items[0].title).toBe('First Task');
      expect(viewedChecklist?.items[1].title).toBe('Second Task');
      expect(viewedChecklist?.items[2].title).toBe('Third Task');

      // When: Updating an item
      const updatedItem = await updateChecklistItem(checklist.id, item1.id, {
        title: 'Updated First Task',
        status: 'in-progress',
      });

      // Then: Item should be updated
      expect(updatedItem.title).toBe('Updated First Task');
      expect(updatedItem.status).toBe('in-progress');

      // When: Marking items as complete
      const completedItem1 = await markItemComplete(checklist.id, item1.id, testUserId);
      const completedItem2 = await markItemComplete(checklist.id, item2.id, testUserId);

      // Then: Items should be marked as completed
      expect(completedItem1.status).toBe('completed');
      expect(completedItem1.completedAt).toBeDefined();
      expect(completedItem1.completedBy).toBe(testUserId);

      expect(completedItem2.status).toBe('completed');
      expect(completedItem2.completedAt).toBeDefined();
      expect(completedItem2.completedBy).toBe(testUserId);

      // When: Calculating progress
      const progress = await calculateProgress(checklist.id);

      // Then: Progress should reflect completion
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(67); // 2/3 = 66.67% rounded to 67

      // When: Viewing updated checklist
      const finalChecklist = await getChecklist(checklist.id);

      // Then: Checklist should show updated state
      expect(finalChecklist?.items.length).toBe(3);
      const completedItems = finalChecklist?.items.filter(
        item => item.status === 'completed'
      );
      expect(completedItems?.length).toBe(2);
    });

    test('[P1] should handle error scenarios: invalid data', async () => {
      // Given: A checklist exists
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Error Test Checklist',
        testUserId
      );

      // When: Trying to create item with invalid data
      // Then: Should handle gracefully
      await expect(
        createChecklistItem('invalid-checklist-id', {
          checklistId: 'invalid-checklist-id',
          title: '',
          status: 'pending',
          order: 0,
        })
      ).rejects.toThrow();

      // When: Trying to get non-existent checklist
      // Then: Should return null
      const nonExistent = await getChecklist('non-existent-id');
      expect(nonExistent).toBeNull();

      // When: Trying to update non-existent item
      // Then: Should throw error
      await expect(
        updateChecklistItem(checklist.id, 'non-existent-item-id', {
          title: 'Test',
        })
      ).rejects.toThrow();
    });

    test('[P1] should handle multiple checklists in same thread', async () => {
      // Given: Multiple checklists in the same thread
      const checklist1 = await createChecklist(
        TEST_THREAD_ID,
        'Checklist 1',
        testUserId
      );
      const checklist2 = await createChecklist(
        TEST_THREAD_ID,
        'Checklist 2',
        testUserId
      );
      const checklist3 = await createChecklist(
        TEST_THREAD_ID,
        'Checklist 3',
        testUserId
      );

      // When: Getting all checklists for the thread
      const allChecklists = await getChecklistsByThread(TEST_THREAD_ID);

      // Then: All checklists should be returned
      expect(allChecklists.length).toBeGreaterThanOrEqual(3);
      const checklistIds = allChecklists.map(c => c.id);
      expect(checklistIds).toContain(checklist1.id);
      expect(checklistIds).toContain(checklist2.id);
      expect(checklistIds).toContain(checklist3.id);

      // And: All should be linked to the same thread
      allChecklists.forEach(c => {
        expect(c.threadId).toBe(TEST_THREAD_ID);
      });
    });

    test('[P2] should update progress in real-time as items are completed', async () => {
      // Given: A checklist with multiple items
      const checklist = await createChecklist(
        TEST_THREAD_ID,
        'Progress Test Checklist',
        testUserId
      );

      // Create 5 items
      const items = [];
      for (let i = 0; i < 5; i++) {
        const item = await createChecklistItem(checklist.id, {
          checklistId: checklist.id,
          title: `Item ${i + 1}`,
          status: 'pending',
          order: i,
        });
        items.push(item);
      }

      // When: No items are completed
      let progress = await calculateProgress(checklist.id);
      expect(progress.total).toBe(5);
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);

      // When: Completing first item
      await markItemComplete(checklist.id, items[0].id, testUserId);
      progress = await calculateProgress(checklist.id);
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBe(20); // 1/5 = 20%

      // When: Completing second item
      await markItemComplete(checklist.id, items[1].id, testUserId);
      progress = await calculateProgress(checklist.id);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(40); // 2/5 = 40%

      // When: Completing all items
      for (let i = 2; i < 5; i++) {
        await markItemComplete(checklist.id, items[i].id, testUserId);
      }
      progress = await calculateProgress(checklist.id);
      expect(progress.completed).toBe(5);
      expect(progress.percentage).toBe(100); // 5/5 = 100%
    });
  });
});


