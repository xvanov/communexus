// vision_analysis_service.test.ts - Unit tests for Vision Analysis Service
import {
  visionAnalysisService,
  ImageAnalysisResult,
  MatchedItem,
} from '../../src/services/visionAnalysisService';
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
  getChecklist: jest.fn(),
  updateChecklistItem: jest.fn(),
}));

describe('visionAnalysisService', () => {
  const mockChecklistId = 'checklist-123';
  const mockImageUrl = 'https://example.com/image.jpg';
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

  describe('analyzeImageForChecklist', () => {
    it('should analyze image and return detected tasks', async () => {
      const mockAnalysis: ImageAnalysisResult = {
        detectedTasks: [
          {
            description: 'Install kitchen cabinets',
            confidence: 'high',
            confidenceScore: 0.95,
          },
          {
            description: 'Paint walls',
            confidence: 'medium',
            confidenceScore: 0.75,
          },
        ],
        completionStatus: 'partial',
        summary: 'Kitchen cabinets installed, walls need painting',
      };

      const { httpsCallable } = require('firebase/functions');
      const mockFn = jest.fn().mockResolvedValue({
        data: {
          success: true,
          analysis: mockAnalysis,
        },
      });
      httpsCallable.mockReturnValue(mockFn);

      const result = await visionAnalysisService.analyzeImageForChecklist(
        mockImageUrl,
        mockChecklistId
      );

      expect(result).toEqual(mockAnalysis);
      expect(httpsCallable).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith({
        operation: 'analyzeImage',
        imageUrl: mockImageUrl,
        checklistId: mockChecklistId,
      });
    });

    it('should throw error if imageUrl is missing', async () => {
      await expect(
        visionAnalysisService.analyzeImageForChecklist('', mockChecklistId)
      ).rejects.toThrow('Image URL is required');
    });

    it('should throw error if imageUrl is invalid format', async () => {
      await expect(
        visionAnalysisService.analyzeImageForChecklist(
          'invalid-url',
          mockChecklistId
        )
      ).rejects.toThrow('Invalid image URL format');
    });

    it('should throw error if analysis fails', async () => {
      const { httpsCallable } = require('firebase/functions');
      const mockFn = jest.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'Analysis failed',
        },
      });
      httpsCallable.mockReturnValue(mockFn);

      await expect(
        visionAnalysisService.analyzeImageForChecklist(
          mockImageUrl,
          mockChecklistId
        )
      ).rejects.toThrow();
    });
  });

  describe('matchImageToChecklistItems', () => {
    it('should match detected tasks to checklist items', async () => {
      const mockAnalysis: ImageAnalysisResult = {
        detectedTasks: [
          {
            description: 'Install kitchen cabinets',
            confidence: 'high',
            confidenceScore: 0.95,
          },
        ],
        completionStatus: 'partial',
        summary: 'Cabinets installed',
      };

      const mockMatches = [
        {
          itemId: 'item-3',
          confidence: 'high',
          confidenceScore: 0.95,
          reasoning: 'Matches "Install cabinets"',
        },
      ];

      const { getChecklist } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: mockItems,
      });

      const { httpsCallable } = require('firebase/functions');
      const mockFn = jest.fn().mockResolvedValue({
        data: {
          success: true,
          matches: mockMatches,
        },
      });
      httpsCallable.mockReturnValue(mockFn);

      const result = await visionAnalysisService.matchImageToChecklistItems(
        mockAnalysis,
        mockChecklistId
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.item.id).toBe('item-3');
      expect(result[0]?.item.title).toBe('Install cabinets');
      expect(result[0]?.confidence).toBe('high');
      expect(result[0]?.confidenceScore).toBe(0.95);
    });

    it('should return empty array if no detected tasks', async () => {
      const mockAnalysis: ImageAnalysisResult = {
        detectedTasks: [],
        completionStatus: 'unknown',
        summary: 'No tasks detected',
      };

      const result = await visionAnalysisService.matchImageToChecklistItems(
        mockAnalysis,
        mockChecklistId
      );

      expect(result).toEqual([]);
    });

    it('should return empty array if checklist not found', async () => {
      const mockAnalysis: ImageAnalysisResult = {
        detectedTasks: [
          {
            description: 'Install cabinets',
            confidence: 'high',
            confidenceScore: 0.95,
          },
        ],
        completionStatus: 'partial',
        summary: 'Cabinets installed',
      };

      const { getChecklist } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue(null);

      const result = await visionAnalysisService.matchImageToChecklistItems(
        mockAnalysis,
        mockChecklistId
      );

      expect(result).toEqual([]);
    });

    it('should handle multiple matches', async () => {
      const mockAnalysis: ImageAnalysisResult = {
        detectedTasks: [
          {
            description: 'Install tiles',
            confidence: 'high',
            confidenceScore: 0.90,
          },
          {
            description: 'Paint walls',
            confidence: 'medium',
            confidenceScore: 0.80,
          },
        ],
        completionStatus: 'partial',
        summary: 'Multiple tasks visible',
      };

      const mockMatches = [
        {
          itemId: 'item-1',
          confidence: 'high',
          confidenceScore: 0.90,
          reasoning: 'Matches "Install tiles"',
        },
        {
          itemId: 'item-2',
          confidence: 'medium',
          confidenceScore: 0.80,
          reasoning: 'Matches "Paint walls"',
        },
      ];

      const { getChecklist } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: mockItems,
      });

      const { httpsCallable } = require('firebase/functions');
      const mockFn = jest.fn().mockResolvedValue({
        data: {
          success: true,
          matches: mockMatches,
        },
      });
      httpsCallable.mockReturnValue(mockFn);

      const result = await visionAnalysisService.matchImageToChecklistItems(
        mockAnalysis,
        mockChecklistId
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.item.id).toBe('item-1');
      expect(result[1]?.item.id).toBe('item-2');
    });
  });

  describe('linkPhotoToItem', () => {
    it('should link photo URL to checklist item', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const itemId = 'item-1';

      const { getChecklist, updateChecklistItem } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: mockItems,
      });
      updateChecklistItem.mockResolvedValue({
        ...mockItems[0],
        mediaAttachments: [photoUrl],
      });

      await visionAnalysisService.linkPhotoToItem(
        mockChecklistId,
        itemId,
        photoUrl
      );

      expect(getChecklist).toHaveBeenCalledWith(mockChecklistId);
      expect(updateChecklistItem).toHaveBeenCalledWith(
        mockChecklistId,
        itemId,
        expect.objectContaining({
          mediaAttachments: expect.arrayContaining([photoUrl]),
        })
      );
    });

    it('should not duplicate photo URL if already present', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const itemId = 'item-1';
      const itemWithPhoto = {
        ...mockItems[0],
        mediaAttachments: [photoUrl],
      };

      const { getChecklist, updateChecklistItem } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: [itemWithPhoto, ...mockItems.slice(1)],
      });

      await visionAnalysisService.linkPhotoToItem(
        mockChecklistId,
        itemId,
        photoUrl
      );

      // Should not call updateChecklistItem if photo already linked
      expect(updateChecklistItem).not.toHaveBeenCalled();
    });

    it('should throw error if checklist not found', async () => {
      const { getChecklist } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue(null);

      await expect(
        visionAnalysisService.linkPhotoToItem(
          mockChecklistId,
          'item-1',
          'https://example.com/photo.jpg'
        )
      ).rejects.toThrow('Checklist not found');
    });

    it('should throw error if item not found', async () => {
      const { getChecklist } = require('../../src/services/checklistService');
      getChecklist.mockResolvedValue({
        id: mockChecklistId,
        items: mockItems,
      });

      await expect(
        visionAnalysisService.linkPhotoToItem(
          mockChecklistId,
          'non-existent-item',
          'https://example.com/photo.jpg'
        )
      ).rejects.toThrow('Checklist item not found');
    });
  });
});

