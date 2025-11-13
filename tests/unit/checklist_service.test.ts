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
import { Checklist, ChecklistItem } from '../../src/types/Checklist';

// Mock Firebase
jest.mock('../../src/services/firebase', () => ({
  getDb: jest.fn(),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: date.getTime() / 1000,
      nanoseconds: 0,
    })),
  },
}));

describe('checklistService', () => {
  const mockThreadId = 'thread-123';
  const mockUserId = 'user-123';
  const mockChecklistId = 'checklist-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChecklist', () => {
    it('should create a checklist with required fields', async () => {
      const { addDoc, collection } = require('firebase/firestore');
      const { getDb } = require('../../src/services/firebase');
      const { getDoc } = require('firebase/firestore');

      const mockDb = {};
      const mockDocRef = { id: mockChecklistId };
      const mockChecklistData = {
        threadId: mockThreadId,
        title: 'Test Checklist',
        items: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        createdBy: mockUserId,
      };

      getDb.mockResolvedValue(mockDb);
      collection.mockReturnValue({});
      addDoc.mockResolvedValue(mockDocRef);
      getDoc.mockResolvedValue({
        exists: () => true,
        id: mockChecklistId,
        data: () => mockChecklistData,
      });

      const result = await createChecklist(mockThreadId, 'Test Checklist', mockUserId);

      expect(result).toBeDefined();
      expect(result.threadId).toBe(mockThreadId);
      expect(result.title).toBe('Test Checklist');
      expect(result.items).toEqual([]);
      expect(result.createdBy).toBe(mockUserId);
    });

    it('should throw error on failure', async () => {
      const { getDb } = require('../../src/services/firebase');
      const { collection, addDoc } = require('firebase/firestore');

      getDb.mockResolvedValue({});
      collection.mockReturnValue({});
      addDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        createChecklist(mockThreadId, 'Test Checklist', mockUserId)
      ).rejects.toThrow('Failed to create checklist');
    });
  });

  describe('getChecklist', () => {
    it('should return checklist if exists', async () => {
      const { getDb } = require('../../src/services/firebase');
      const { doc, getDoc } = require('firebase/firestore');

      const mockDb = {};
      const mockChecklistData = {
        threadId: mockThreadId,
        title: 'Test Checklist',
        items: [],
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        createdBy: mockUserId,
      };

      getDb.mockResolvedValue(mockDb);
      doc.mockReturnValue({});
      getDoc.mockResolvedValue({
        exists: () => true,
        id: mockChecklistId,
        data: () => mockChecklistData,
      });

      const result = await getChecklist(mockChecklistId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockChecklistId);
      expect(result?.title).toBe('Test Checklist');
    });

    it('should return null if checklist does not exist', async () => {
      const { getDb } = require('../../src/services/firebase');
      const { doc, getDoc } = require('firebase/firestore');

      getDb.mockResolvedValue({});
      doc.mockReturnValue({});
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getChecklist(mockChecklistId);

      expect(result).toBeNull();
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', async () => {
      const { getChecklist } = require('../../src/services/checklistService');
      
      // Mock getChecklist to return a checklist with items
      const mockChecklist: Checklist = {
        id: mockChecklistId,
        threadId: mockThreadId,
        title: 'Test Checklist',
        items: [
          {
            id: 'item-1',
            checklistId: mockChecklistId,
            title: 'Item 1',
            status: 'completed',
            order: 0,
          },
          {
            id: 'item-2',
            checklistId: mockChecklistId,
            title: 'Item 2',
            status: 'pending',
            order: 1,
          },
          {
            id: 'item-3',
            checklistId: mockChecklistId,
            title: 'Item 3',
            status: 'completed',
            order: 2,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      };

      jest.spyOn(require('../../src/services/checklistService'), 'getChecklist')
        .mockResolvedValue(mockChecklist);

      const result = await calculateProgress(mockChecklistId);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.percentage).toBe(67); // 2/3 * 100 = 66.67, rounded to 67
    });

    it('should return 0% for empty checklist', async () => {
      const mockChecklist: Checklist = {
        id: mockChecklistId,
        threadId: mockThreadId,
        title: 'Test Checklist',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      };

      jest.spyOn(require('../../src/services/checklistService'), 'getChecklist')
        .mockResolvedValue(mockChecklist);

      const result = await calculateProgress(mockChecklistId);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('markItemComplete', () => {
    it('should mark item as completed', async () => {
      const { updateChecklistItem } = require('../../src/services/checklistService');
      
      const mockUpdatedItem: ChecklistItem = {
        id: 'item-1',
        checklistId: mockChecklistId,
        title: 'Item 1',
        status: 'completed',
        order: 0,
        completedAt: new Date(),
        completedBy: mockUserId,
      };

      jest.spyOn(require('../../src/services/checklistService'), 'updateChecklistItem')
        .mockResolvedValue(mockUpdatedItem);

      const result = await markItemComplete(mockChecklistId, 'item-1', mockUserId);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(result.completedBy).toBe(mockUserId);
    });
  });
});

