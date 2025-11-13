// checklist_nlp_service.test.ts - Unit tests for Checklist NLP Service
import {
  checklistNLPService,
  CommandPreview,
} from '../../src/services/checklistNLPService';
import { ChecklistItem } from '../../src/types/Checklist';

// Mock Firebase Functions
jest.mock('../../src/services/firebase', () => ({
  getFunctionsClient: jest.fn(),
}));

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

// Mock checklistService
jest.mock('../../src/services/checklistService', () => ({
  markItemComplete: jest.fn(),
  createChecklistItem: jest.fn(),
  getChecklist: jest.fn(),
}));

describe('checklistNLPService', () => {
  const mockChecklistId = 'checklist-123';
  const mockItems: ChecklistItem[] = [
    {
      id: 'item-1',
      checklistId: mockChecklistId,
      title: 'Install tiles',
      status: 'pending',
      order: 0,
    },
    {
      id: 'item-2',
      checklistId: mockChecklistId,
      title: 'Paint walls',
      status: 'pending',
      order: 1,
    },
    {
      id: 'item-3',
      checklistId: mockChecklistId,
      title: 'Install cabinets',
      status: 'completed',
      order: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyChecklistIntent', () => {
    it('should classify mark_complete intent', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: { intent: 'mark_complete' },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const intent = await checklistNLPService.classifyChecklistIntent(
        'mark item 3 complete'
      );

      expect(intent).toBe('mark_complete');
      expect(mockFn).toHaveBeenCalledWith({
        operation: 'classifyIntent',
        text: 'mark item 3 complete',
      });
    });

    it('should classify create_item intent', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: { intent: 'create_item' },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const intent = await checklistNLPService.classifyChecklistIntent(
        'add new task: install tiles'
      );

      expect(intent).toBe('create_item');
    });

    it('should classify query_status intent', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: { intent: 'query_status' },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const intent = await checklistNLPService.classifyChecklistIntent(
        "what's next?"
      );

      expect(intent).toBe('query_status');
    });

    it('should return unknown for unclear commands', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: { intent: 'unknown' },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const intent = await checklistNLPService.classifyChecklistIntent('hello');

      expect(intent).toBe('unknown');
    });

    it('should handle errors gracefully', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const intent = await checklistNLPService.classifyChecklistIntent('test');

      expect(intent).toBe('unknown');
    });
  });

  describe('matchChecklistItem', () => {
    it('should match item by number', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: {
          matchedItem: {
            id: 'item-2',
            title: 'Paint walls',
            confidence: 1.0,
          },
        },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const matched = await checklistNLPService.matchChecklistItem(
        'item 2',
        mockChecklistId,
        mockItems
      );

      expect(matched).toBeDefined();
      expect(matched?.id).toBe('item-2');
      expect(matched?.title).toBe('Paint walls');
    });

    it('should return null if no match found', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: { matchedItem: null },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const matched = await checklistNLPService.matchChecklistItem(
        'nonexistent item',
        mockChecklistId,
        mockItems
      );

      expect(matched).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const matched = await checklistNLPService.matchChecklistItem(
        'test',
        mockChecklistId,
        mockItems
      );

      expect(matched).toBeNull();
    });
  });

  describe('processChecklistCommand', () => {
    it('should process mark_complete command', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: {
          preview: {
            intent: 'mark_complete',
            matchedItem: {
              id: 'item-1',
              title: 'Install tiles',
              confidence: 0.9,
            },
            suggestedAction: 'Mark "Install tiles" as complete',
            confidence: 0.9,
          },
        },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const preview = await checklistNLPService.processChecklistCommand(
        'mark item 1 complete',
        mockChecklistId,
        mockItems
      );

      expect(preview.intent).toBe('mark_complete');
      expect(preview.matchedItem?.id).toBe('item-1');
      expect(preview.suggestedAction).toContain('Install tiles');
    });

    it('should process create_item command', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockResolvedValue({
        data: {
          preview: {
            intent: 'create_item',
            suggestedAction: 'Add new item: "Install countertops"',
            confidence: 0.8,
            newItemTitle: 'Install countertops',
          },
        },
      });

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      const preview = await checklistNLPService.processChecklistCommand(
        'add new task: install countertops',
        mockChecklistId,
        mockItems
      );

      expect(preview.intent).toBe('create_item');
      expect(preview.newItemTitle).toBe('Install countertops');
    });

    it('should handle errors', async () => {
      const { httpsCallable } = require('firebase/functions');
      const { getFunctionsClient } = require('../../src/services/firebase');

      const mockFn = jest.fn().mockRejectedValue(new Error('Processing failed'));

      getFunctionsClient.mockResolvedValue({});
      httpsCallable.mockReturnValue(mockFn);

      await expect(
        checklistNLPService.processChecklistCommand(
          'test',
          mockChecklistId,
          mockItems
        )
      ).rejects.toThrow();
    });
  });

  describe('executeCommand', () => {
    it('should execute mark_complete command', async () => {
      const { markItemComplete } = require('../../src/services/checklistService');
      markItemComplete.mockResolvedValue({
        id: 'item-1',
        checklistId: mockChecklistId,
        title: 'Install tiles',
        status: 'completed',
        order: 0,
      });

      const preview: CommandPreview = {
        intent: 'mark_complete',
        matchedItem: mockItems[0]!,
        suggestedAction: 'Mark "Install tiles" as complete',
        confidence: 0.9,
      };

      const result = await checklistNLPService.executeCommand(
        preview,
        mockChecklistId,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.item?.status).toBe('completed');
      expect(markItemComplete).toHaveBeenCalledWith(
        mockChecklistId,
        'item-1',
        'user-123'
      );
    });

    it('should execute create_item command', async () => {
      const { createChecklistItem, getChecklist } = require('../../src/services/checklistService');
      
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: mockItems,
      });

      createChecklistItem.mockResolvedValue({
        id: 'item-4',
        checklistId: mockChecklistId,
        title: 'Install countertops',
        status: 'pending',
        order: 3,
      });

      const preview: CommandPreview = {
        intent: 'create_item',
        suggestedAction: 'Add new item: "Install countertops"',
        confidence: 0.8,
        newItemTitle: 'Install countertops',
      };

      const result = await checklistNLPService.executeCommand(
        preview,
        mockChecklistId,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.item?.title).toBe('Install countertops');
      expect(createChecklistItem).toHaveBeenCalled();
    });

    it('should handle query_status command', async () => {
      const preview: CommandPreview = {
        intent: 'query_status',
        suggestedAction: '2 of 3 tasks complete',
        confidence: 0.9,
        queryResult: '2 of 3 tasks complete',
      };

      const result = await checklistNLPService.executeCommand(
        preview,
        mockChecklistId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('2 of 3 tasks complete');
    });

    it('should handle errors gracefully', async () => {
      const { markItemComplete } = require('../../src/services/checklistService');
      markItemComplete.mockRejectedValue(new Error('Service error'));

      const preview: CommandPreview = {
        intent: 'mark_complete',
        matchedItem: mockItems[0]!,
        suggestedAction: 'Mark "Install tiles" as complete',
        confidence: 0.9,
      };

      const result = await checklistNLPService.executeCommand(
        preview,
        mockChecklistId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

