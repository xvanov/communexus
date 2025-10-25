import { aiThreadSummary } from '../../functions/src/aiThreadSummary';
import { aiActionExtraction } from '../../functions/src/aiActionExtraction';
import { aiPriorityDetection } from '../../functions/src/aiPriorityDetection';
import { aiSmartSearch } from '../../functions/src/aiSmartSearch';
import { aiProactiveAgent } from '../../functions/src/aiProactiveAgent';
import { generateMockMessages, generateMockContext } from './testUtils';

// Mock the AI service
jest.mock('../../functions/src/aiService', () => ({
  aiService: {
    generateThreadSummary: jest.fn(),
    extractActionItems: jest.fn(),
    detectPriority: jest.fn(),
    smartSearch: jest.fn(),
    getProactiveSuggestions: jest.fn(),
  },
}));

describe('AI Cloud Functions', () => {
  const mockAiService = require('../../functions/src/aiService').aiService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aiThreadSummary', () => {
    it('should generate thread summary successfully', async () => {
      const mockSummary = {
        id: 'summary-1',
        threadId: 'thread-1',
        summary: 'Mock thread summary',
        keyPoints: ['Point 1', 'Point 2'],
        actionItems: [],
        generatedAt: new Date(),
      };

      mockAiService.generateThreadSummary.mockResolvedValue(mockSummary);

      const request = {
        data: {
          threadId: 'thread-1',
          messages: generateMockMessages(5),
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(true);
      expect(result.summary).toBe(mockSummary.summary);
      expect(result.keyPoints).toEqual(mockSummary.keyPoints);
      expect(result.actionItems).toEqual(mockSummary.actionItems);
      expect(mockAiService.generateThreadSummary).toHaveBeenCalledWith(
        'thread-1',
        request.data.messages
      );
    });

    it('should handle missing threadId', async () => {
      const request = {
        data: {
          messages: generateMockMessages(5),
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread ID is required');
    });

    it('should handle missing messages', async () => {
      const request = {
        data: {
          threadId: 'thread-1',
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Messages array is required');
    });

    it('should handle AI service errors', async () => {
      mockAiService.generateThreadSummary.mockRejectedValue(
        new Error('AI Service Error')
      );

      const request = {
        data: {
          threadId: 'thread-1',
          messages: generateMockMessages(5),
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI Service Error');
    });

    it('should handle empty thread', async () => {
      mockAiService.generateThreadSummary.mockResolvedValue(null);

      const request = {
        data: {
          threadId: 'thread-1',
          messages: [],
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to generate summary for empty thread');
    });
  });

  describe('aiActionExtraction', () => {
    it('should extract action items successfully', async () => {
      const mockActionItems = [
        {
          id: 'action-1',
          text: 'Send invoice',
          priority: 'high' as const,
          status: 'pending' as const,
          createdAt: new Date(),
        },
      ];

      mockAiService.extractActionItems.mockResolvedValue(mockActionItems);

      const request = {
        data: {
          threadId: 'thread-1',
          messages: generateMockMessages(5),
        },
      };

      const result = await aiActionExtraction(request);

      expect(result.success).toBe(true);
      expect(result.actionItems).toEqual(mockActionItems);
      expect(result.count).toBe(1);
      expect(mockAiService.extractActionItems).toHaveBeenCalledWith(
        'thread-1',
        request.data.messages
      );
    });

    it('should handle missing threadId', async () => {
      const request = {
        data: {
          messages: generateMockMessages(5),
        },
      };

      const result = await aiActionExtraction(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread ID is required');
    });

    it('should handle AI service errors', async () => {
      mockAiService.extractActionItems.mockRejectedValue(
        new Error('AI Service Error')
      );

      const request = {
        data: {
          threadId: 'thread-1',
          messages: generateMockMessages(5),
        },
      };

      const result = await aiActionExtraction(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI Service Error');
      expect(result.actionItems).toEqual([]);
    });
  });

  describe('aiPriorityDetection', () => {
    it('should detect priority successfully', async () => {
      const mockPriority = 'high' as const;

      mockAiService.detectPriority.mockResolvedValue(mockPriority);

      const request = {
        data: {
          messageId: 'msg-1',
          message: {
            id: 'msg-1',
            text: 'URGENT: Server down!',
            timestamp: new Date(),
          },
        },
      };

      const result = await aiPriorityDetection(request);

      expect(result.success).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.messageId).toBe('msg-1');
      expect(mockAiService.detectPriority).toHaveBeenCalledWith(
        'msg-1',
        request.data.message
      );
    });

    it('should handle missing messageId', async () => {
      const request = {
        data: {
          message: { text: 'Test message' },
        },
      };

      const result = await aiPriorityDetection(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message ID is required');
    });

    it('should handle missing message', async () => {
      const request = {
        data: {
          messageId: 'msg-1',
        },
      };

      const result = await aiPriorityDetection(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Message data is required');
    });

    it('should default to medium priority when AI service returns null', async () => {
      mockAiService.detectPriority.mockResolvedValue(null);

      const request = {
        data: {
          messageId: 'msg-1',
          message: { text: 'Test message' },
        },
      };

      const result = await aiPriorityDetection(request);

      expect(result.success).toBe(true);
      expect(result.priority).toBe('medium');
    });
  });

  describe('aiSmartSearch', () => {
    it('should perform smart search successfully', async () => {
      const mockResults = [
        {
          messageId: 'msg-1',
          threadId: 'thread-1',
          snippet: 'Invoice payment discussion',
          relevanceScore: 0.95,
          context: 'Payment terms',
        },
      ];

      mockAiService.smartSearch.mockResolvedValue(mockResults);

      const request = {
        data: {
          query: 'invoice payment',
          threadId: 'thread-1',
        },
      };

      const result = await aiSmartSearch(request);

      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockResults);
      expect(result.count).toBe(1);
      expect(result.query).toBe('invoice payment');
      expect(mockAiService.smartSearch).toHaveBeenCalledWith(
        'invoice payment',
        'thread-1'
      );
    });

    it('should handle missing query', async () => {
      const request = {
        data: {
          threadId: 'thread-1',
        },
      };

      const result = await aiSmartSearch(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search query is required');
    });

    it('should handle invalid query type', async () => {
      const request = {
        data: {
          query: 123, // Invalid type
          threadId: 'thread-1',
        },
      };

      const result = await aiSmartSearch(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search query is required');
    });

    it('should handle AI service errors', async () => {
      mockAiService.smartSearch.mockRejectedValue(
        new Error('AI Service Error')
      );

      const request = {
        data: {
          query: 'test query',
          threadId: 'thread-1',
        },
      };

      const result = await aiSmartSearch(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI Service Error');
      expect(result.results).toEqual([]);
    });
  });

  describe('aiProactiveAgent', () => {
    it('should generate proactive suggestions successfully', async () => {
      const mockSuggestions = [
        {
          id: 'suggestion-1',
          type: 'follow_up' as const,
          message: 'Follow up on invoice payment',
          confidence: 0.9,
          createdAt: new Date(),
        },
      ];

      mockAiService.getProactiveSuggestions.mockResolvedValue(mockSuggestions);

      const request = {
        data: {
          threadId: 'thread-1',
          context: generateMockContext(),
        },
      };

      const result = await aiProactiveAgent(request);

      expect(result.success).toBe(true);
      expect(result.suggestions).toEqual(mockSuggestions);
      expect(result.count).toBe(1);
      expect(result.threadId).toBe('thread-1');
      expect(mockAiService.getProactiveSuggestions).toHaveBeenCalledWith(
        'thread-1',
        request.data.context
      );
    });

    it('should handle missing threadId', async () => {
      const request = {
        data: {
          context: generateMockContext(),
        },
      };

      const result = await aiProactiveAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread ID is required');
    });

    it('should handle missing context', async () => {
      const request = {
        data: {
          threadId: 'thread-1',
        },
      };

      const result = await aiProactiveAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Context data is required');
    });

    it('should handle AI service errors', async () => {
      mockAiService.getProactiveSuggestions.mockRejectedValue(
        new Error('AI Service Error')
      );

      const request = {
        data: {
          threadId: 'thread-1',
          context: generateMockContext(),
        },
      };

      const result = await aiProactiveAgent(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI Service Error');
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      mockAiService.generateThreadSummary.mockRejectedValue('Unknown error');

      const request = {
        data: {
          threadId: 'thread-1',
          messages: generateMockMessages(5),
        },
      };

      const result = await aiThreadSummary(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });
});
