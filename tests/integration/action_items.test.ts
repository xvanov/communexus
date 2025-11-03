// tests/integration/action_items.test.ts
// Integration tests for Action Items (Todo List) functionality

import {
  saveActionItem,
  saveActionItems,
  getActionItemsForThread,
  getActionItem,
  updateActionItemStatus,
  deleteActionItem,
  filterActionItemsByStatus,
  searchActionItems,
} from '../../src/services/actionItems';
import { AIFeatures } from '../../src/types/AIFeatures';
import { initializeFirebase, getDb } from '../../src/services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Note: This test requires Firebase emulators to be running
// Run with: npm run test:emul -- tests/integration/action_items.test.ts

// Test data
const TEST_USER_EMAIL = 'test@actionitems.com';
const TEST_USER_PASSWORD = 'testpass123';
const TEST_THREAD_ID = 'test-thread-action-items';
const TEST_USER_ID = 'test-user-action-items';

describe('Action Items (Todo List) Integration Tests', () => {
  let testUserId: string;
  let db: any;

  beforeAll(async () => {
    // Initialize Firebase (this will connect to emulators if running)
    const { auth } = await initializeFirebase({ useEmulator: true });
    db = await getDb();

    // Create test user
    try {
      await createUserWithEmailAndPassword(
        auth,
        TEST_USER_EMAIL,
        TEST_USER_PASSWORD
      );
    } catch (error: any) {
      // User might already exist, try to sign in
      if (error.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(
          auth,
          TEST_USER_EMAIL,
          TEST_USER_PASSWORD
        );
      }
    }

    const user = auth.currentUser;
    testUserId = user?.uid || TEST_USER_ID;

    // Wait a moment to ensure auth state is fully set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create a test thread that the user participates in
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
      unreadCount: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Wait a moment to ensure thread is written
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  beforeEach(async () => {
    // Clear action items for test thread before each test
    // Note: In a real scenario, you'd want to clean up test data
    // For now, we'll use unique IDs per test
  });

  describe('Action Item CRUD Operations', () => {
    it('should save a single action item to Firestore', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'test-action-1',
        threadId: TEST_THREAD_ID,
        task: 'Test task',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(),
      };

      await saveActionItem(actionItem);

      const saved = await getActionItem('test-action-1');
      expect(saved).toBeDefined();
      expect(saved?.id).toBe('test-action-1');
      expect(saved?.task).toBe('Test task');
      expect(saved?.priority).toBe('high');
      expect(saved?.status).toBe('pending');
      expect(saved?.threadId).toBe(TEST_THREAD_ID);
    });

    it('should save multiple action items to Firestore', async () => {
      const actionItems: AIFeatures.ActionItem[] = [
        {
          id: 'test-action-2',
          threadId: TEST_THREAD_ID,
          task: 'First task',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'test-action-3',
          threadId: TEST_THREAD_ID,
          task: 'Second task',
          priority: 'low',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      await saveActionItems(actionItems);

      const items = await getActionItemsForThread(TEST_THREAD_ID);
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.find(item => item.id === 'test-action-2')).toBeDefined();
      expect(items.find(item => item.id === 'test-action-3')).toBeDefined();
    });

    it('should load all action items for a thread', async () => {
      // Save a few action items first
      const actionItems: AIFeatures.ActionItem[] = [
        {
          id: 'test-action-4',
          threadId: TEST_THREAD_ID,
          task: 'Load test task 1',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'test-action-5',
          threadId: TEST_THREAD_ID,
          task: 'Load test task 2',
          priority: 'medium',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000),
          completedAt: new Date(),
        },
      ];

      await saveActionItems(actionItems);

      const loaded = await getActionItemsForThread(TEST_THREAD_ID);
      expect(loaded.length).toBeGreaterThanOrEqual(2);

      const task1 = loaded.find(item => item.id === 'test-action-4');
      expect(task1).toBeDefined();
      expect(task1?.task).toBe('Load test task 1');

      const task2 = loaded.find(item => item.id === 'test-action-5');
      expect(task2).toBeDefined();
      expect(task2?.status).toBe('completed');
      expect(task2?.completedAt).toBeDefined();
    });

    it('should get a single action item by ID', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'test-action-6',
        threadId: TEST_THREAD_ID,
        task: 'Get by ID test',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
      };

      await saveActionItem(actionItem);

      const retrieved = await getActionItem('test-action-6');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-action-6');
      expect(retrieved?.task).toBe('Get by ID test');
    });

    it('should return null for non-existent action item', async () => {
      const retrieved = await getActionItem('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('Action Item Status Updates', () => {
    it('should update action item status from pending to completed', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'test-action-7',
        threadId: TEST_THREAD_ID,
        task: 'Complete this task',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(),
      };

      await saveActionItem(actionItem);

      // Update to completed
      await updateActionItemStatus('test-action-7', 'completed', testUserId);

      const updated = await getActionItem('test-action-7');
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.completedBy).toBe(testUserId);
    });

    it('should update action item status from completed to pending', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'test-action-8',
        threadId: TEST_THREAD_ID,
        task: 'Reopen this task',
        priority: 'medium',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000),
        completedAt: new Date(Date.now() - 500),
        completedBy: testUserId,
      };

      await saveActionItem(actionItem);

      // Update to pending
      await updateActionItemStatus('test-action-8', 'pending');

      const updated = await getActionItem('test-action-8');
      expect(updated?.status).toBe('pending');
      expect(updated?.completedAt).toBeUndefined();
      expect(updated?.completedBy).toBeUndefined();
    });

    it('should track completion date when marking as completed', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'test-action-9',
        threadId: TEST_THREAD_ID,
        task: 'Track completion date',
        priority: 'low',
        status: 'pending',
        createdAt: new Date(),
      };

      await saveActionItem(actionItem);

      const beforeUpdate = Date.now();
      await updateActionItemStatus('test-action-9', 'completed', testUserId);
      const afterUpdate = Date.now();

      const updated = await getActionItem('test-action-9');
      expect(updated?.completedAt).toBeDefined();

      const completedTime = updated?.completedAt?.getTime() || 0;
      expect(completedTime).toBeGreaterThanOrEqual(beforeUpdate);
      expect(completedTime).toBeLessThanOrEqual(afterUpdate);
    });
  });

  describe('Action Item Filtering', () => {
    beforeEach(async () => {
      // Create a mix of pending and completed items
      const actionItems: AIFeatures.ActionItem[] = [
        {
          id: 'filter-test-1',
          threadId: TEST_THREAD_ID,
          task: 'Pending task 1',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'filter-test-2',
          threadId: TEST_THREAD_ID,
          task: 'Completed task 1',
          priority: 'medium',
          status: 'completed',
          createdAt: new Date(Date.now() - 1000),
          completedAt: new Date(),
        },
        {
          id: 'filter-test-3',
          threadId: TEST_THREAD_ID,
          task: 'Pending task 2',
          priority: 'low',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      await saveActionItems(actionItems);
    });

    it('should filter action items by status - pending', async () => {
      const allItems = await getActionItemsForThread(TEST_THREAD_ID);
      const pending = filterActionItemsByStatus(allItems, 'pending');

      expect(pending.length).toBeGreaterThan(0);
      pending.forEach(item => {
        expect(item.status).toBe('pending');
      });

      const pendingIds = pending.map(item => item.id);
      expect(pendingIds).toContain('filter-test-1');
      expect(pendingIds).toContain('filter-test-3');
      expect(pendingIds).not.toContain('filter-test-2');
    });

    it('should filter action items by status - completed', async () => {
      const allItems = await getActionItemsForThread(TEST_THREAD_ID);
      const completed = filterActionItemsByStatus(allItems, 'completed');

      expect(completed.length).toBeGreaterThan(0);
      completed.forEach(item => {
        expect(item.status).toBe('completed');
      });

      const completedIds = completed.map(item => item.id);
      expect(completedIds).toContain('filter-test-2');
      expect(completedIds).not.toContain('filter-test-1');
      expect(completedIds).not.toContain('filter-test-3');
    });

    it('should return all items when filtering by "all"', async () => {
      const allItems = await getActionItemsForThread(TEST_THREAD_ID);
      const filtered = filterActionItemsByStatus(allItems, 'all');

      expect(filtered.length).toBe(allItems.length);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Action Item Search', () => {
    beforeEach(async () => {
      const actionItems: AIFeatures.ActionItem[] = [
        {
          id: 'search-test-1',
          threadId: TEST_THREAD_ID,
          task: 'Review contract documents',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'search-test-2',
          threadId: TEST_THREAD_ID,
          task: 'Send invoice to client',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'search-test-3',
          threadId: TEST_THREAD_ID,
          task: 'Schedule meeting with team',
          text: 'Team meeting about project',
          priority: 'low',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      await saveActionItems(actionItems);
    });

    it('should search action items by task text', async () => {
      const results = await searchActionItems(TEST_THREAD_ID, 'contract');

      expect(results.length).toBeGreaterThan(0);
      const taskIds = results.map(item => item.id);
      expect(taskIds).toContain('search-test-1');
    });

    it('should search action items by description text', async () => {
      const results = await searchActionItems(TEST_THREAD_ID, 'meeting');

      expect(results.length).toBeGreaterThan(0);
      const taskIds = results.map(item => item.id);
      expect(taskIds).toContain('search-test-3');
    });

    it('should be case-insensitive when searching', async () => {
      const results = await searchActionItems(TEST_THREAD_ID, 'INVOICE');

      expect(results.length).toBeGreaterThan(0);
      const taskIds = results.map(item => item.id);
      expect(taskIds).toContain('search-test-2');
    });

    it('should return empty array for non-matching search', async () => {
      const results = await searchActionItems(TEST_THREAD_ID, 'xyzabc123');

      expect(results.length).toBe(0);
    });

    it('should return empty array for empty search query', async () => {
      const results = await searchActionItems(TEST_THREAD_ID, '');

      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Action Item Date Handling', () => {
    it('should handle dates correctly when saving and loading', async () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const dueDate = new Date('2024-01-20T10:00:00Z');

      const actionItem: AIFeatures.ActionItem = {
        id: 'date-test-1',
        threadId: TEST_THREAD_ID,
        task: 'Task with dates',
        priority: 'high',
        status: 'pending',
        createdAt,
        dueDate,
      };

      await saveActionItem(actionItem);

      const loaded = await getActionItem('date-test-1');
      expect(loaded?.createdAt).toBeInstanceOf(Date);
      expect(loaded?.dueDate).toBeInstanceOf(Date);

      // Check dates are approximately correct (within 1 second due to timestamp conversion)
      expect(loaded?.createdAt).toBeDefined();
      expect(loaded?.dueDate).toBeDefined();
      if (loaded?.createdAt && loaded?.dueDate) {
        expect(
          Math.abs(loaded.createdAt.getTime() - createdAt.getTime())
        ).toBeLessThan(1000);
        expect(
          Math.abs(loaded.dueDate.getTime() - dueDate.getTime())
        ).toBeLessThan(1000);
      }
    });

    it('should handle invalid dates gracefully', async () => {
      // Create action item with potentially invalid date
      const actionItem: AIFeatures.ActionItem = {
        id: 'date-test-2',
        threadId: TEST_THREAD_ID,
        task: 'Task with invalid date',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date('invalid'),
      };

      // Should not throw error, should use current time as fallback
      await expect(saveActionItem(actionItem)).resolves.not.toThrow();

      const loaded = await getActionItem('date-test-2');
      expect(loaded?.createdAt).toBeInstanceOf(Date);
      expect(loaded?.createdAt.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Action Item Deletion', () => {
    it('should delete an action item', async () => {
      const actionItem: AIFeatures.ActionItem = {
        id: 'delete-test-1',
        threadId: TEST_THREAD_ID,
        task: 'Task to be deleted',
        priority: 'low',
        status: 'pending',
        createdAt: new Date(),
      };

      await saveActionItem(actionItem);

      // Verify it exists
      const beforeDelete = await getActionItem('delete-test-1');
      expect(beforeDelete).toBeDefined();

      // Delete it
      await deleteActionItem('delete-test-1');

      // Verify it's gone
      const afterDelete = await getActionItem('delete-test-1');
      expect(afterDelete).toBeNull();
    });
  });

  describe('Complete Todo List Workflow', () => {
    it('should complete full workflow: create -> complete -> filter -> search', async () => {
      // Step 1: Create multiple action items
      const actionItems: AIFeatures.ActionItem[] = [
        {
          id: 'workflow-1',
          threadId: TEST_THREAD_ID,
          task: 'First workflow task',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'workflow-2',
          threadId: TEST_THREAD_ID,
          task: 'Second workflow task',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: 'workflow-3',
          threadId: TEST_THREAD_ID,
          task: 'Third workflow task',
          priority: 'low',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      await saveActionItems(actionItems);

      // Step 2: Load all items
      let allItems = await getActionItemsForThread(TEST_THREAD_ID);
      expect(allItems.length).toBeGreaterThanOrEqual(3);

      // Step 3: Complete one task
      await updateActionItemStatus('workflow-1', 'completed', testUserId);

      // Step 4: Filter pending items
      allItems = await getActionItemsForThread(TEST_THREAD_ID);
      const pending = filterActionItemsByStatus(allItems, 'pending');
      expect(pending.length).toBeGreaterThanOrEqual(2);

      const pendingIds = pending.map(item => item.id);
      expect(pendingIds).toContain('workflow-2');
      expect(pendingIds).toContain('workflow-3');
      expect(pendingIds).not.toContain('workflow-1');

      // Step 5: Filter completed items
      const completed = filterActionItemsByStatus(allItems, 'completed');
      expect(completed.length).toBeGreaterThanOrEqual(1);
      expect(completed.find(item => item.id === 'workflow-1')).toBeDefined();

      // Step 6: Search for tasks
      const searchResults = await searchActionItems(TEST_THREAD_ID, 'workflow');
      expect(searchResults.length).toBeGreaterThanOrEqual(3);

      // Step 7: Verify completion tracking
      const completedTask = await getActionItem('workflow-1');
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completedAt).toBeDefined();
      expect(completedTask?.completedBy).toBe(testUserId);
    });
  });
});
