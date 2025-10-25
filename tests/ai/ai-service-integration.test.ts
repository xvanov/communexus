import { AIService } from '../../functions/src/aiService';
import {
  mockOpenAIResponses,
  generateMockMessages,
  generateMockThread,
  generateMockContext,
  measurePerformance,
  expectPerformanceWithinLimit,
  validateThreadSummary,
  validateActionItem,
  validateSearchResult,
  validateProactiveSuggestion,
  testConfig,
} from './testUtils';

// Mock the AI service dependencies
jest.mock('../../functions/src/aiConfig', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  chatModel: {
    invoke: jest.fn(),
  },
  getAIConfig: () => ({
    openai: {
      apiKey: 'test-key',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
    },
    features: {
      threadSummary: { enabled: true, maxMessages: 50, responseTime: 2000 },
      actionExtraction: {
        enabled: true,
        minConfidence: 0.8,
        responseTime: 1500,
      },
      priorityDetection: { enabled: true, responseTime: 1000 },
      smartSearch: { enabled: true, maxResults: 10, responseTime: 2000 },
      decisionTracking: { enabled: true, responseTime: 1000 },
      proactiveAgent: { enabled: true, responseTime: 3000 },
    },
    performance: {
      enableCaching: true,
      cacheExpiry: 3600,
      rateLimitPerMinute: 60,
    },
  }),
  validateAIConfig: () => [],
  checkRateLimit: () => true,
  getCachedResult: () => null,
  setCachedResult: () => {},
}));

describe('AIService Integration Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('Thread Summary', () => {
    it('should generate thread summary with valid input', async () => {
      const messages = generateMockMessages(10);
      const threadId = 'test-thread-1';

      // Mock OpenAI response
      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockOpenAIResponses.threadSummary),
            },
          },
        ],
      });

      const { result: summary, duration } = await measurePerformance(
        () => aiService.generateThreadSummary(threadId, messages),
        'Thread Summary Generation'
      );

      expect(summary).toBeDefined();
      validateThreadSummary(summary!);
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.threadSummary,
        'Thread Summary'
      );

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should handle empty message list', async () => {
      const summary = await aiService.generateThreadSummary('empty-thread', []);
      expect(summary).toBeNull();
    });

    it('should respect max messages limit', async () => {
      const messages = generateMockMessages(100); // More than the 50 limit
      const threadId = 'large-thread';

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockOpenAIResponses.threadSummary),
            },
          },
        ],
      });

      await aiService.generateThreadSummary(threadId, messages);

      // Verify that only the last 50 messages were processed
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const userMessage = callArgs.messages.find(
        (msg: any) => msg.role === 'user'
      );
      expect(userMessage.content).toContain('50.'); // Last message should be #50
    });
  });

  describe('Action Item Extraction', () => {
    it('should extract action items from messages', async () => {
      const messages = generateMockMessages(5);
      const threadId = 'test-thread-2';

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockOpenAIResponses.actionItems),
            },
          },
        ],
      });

      const { result: actionItems, duration } = await measurePerformance(
        () => aiService.extractActionItems(threadId, messages),
        'Action Item Extraction'
      );

      expect(Array.isArray(actionItems)).toBe(true);
      expect(actionItems.length).toBeGreaterThan(0);

      actionItems.forEach(validateActionItem);
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.actionExtraction,
        'Action Extraction'
      );
    });

    it('should handle messages with no action items', async () => {
      const messages = [
        { id: '1', text: 'Hello there', timestamp: new Date() },
        { id: '2', text: 'How are you?', timestamp: new Date() },
      ];

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '[]', // Empty array
            },
          },
        ],
      });

      const actionItems = await aiService.extractActionItems(
        'no-actions-thread',
        messages
      );
      expect(Array.isArray(actionItems)).toBe(true);
      expect(actionItems.length).toBe(0);
    });
  });

  describe('Priority Detection', () => {
    it('should detect high priority messages', async () => {
      const message = {
        id: 'urgent-msg',
        text: 'URGENT: Server is down, need immediate attention!',
        timestamp: new Date(),
      };

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'high',
            },
          },
        ],
      });

      const { result: priority, duration } = await measurePerformance(
        () => aiService.detectPriority(message.id, message),
        'Priority Detection'
      );

      expect(priority).toBe('high');
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.priorityDetection,
        'Priority Detection'
      );
    });

    it('should detect low priority messages', async () => {
      const message = {
        id: 'casual-msg',
        text: 'Just wanted to say hello',
        timestamp: new Date(),
      };

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'low',
            },
          },
        ],
      });

      const priority = await aiService.detectPriority(message.id, message);
      expect(priority).toBe('low');
    });
  });

  describe('Smart Search', () => {
    it('should perform semantic search', async () => {
      const query = 'invoice payment';
      const threadId = 'search-thread';

      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockOpenAIResponses.searchResults),
            },
          },
        ],
      });

      const { result: results, duration } = await measurePerformance(
        () => aiService.smartSearch(query, threadId),
        'Smart Search'
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      results.forEach(validateSearchResult);
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.smartSearch,
        'Smart Search'
      );
    });

    it('should handle empty search query', async () => {
      const results = await aiService.smartSearch('', 'thread-id');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Decision Tracking', () => {
    it('should track a decision', async () => {
      const decision = {
        id: 'decision-1',
        title: 'Approved budget increase',
        description: 'Client approved 10% budget increase',
        status: 'approved' as const,
        decidedAt: new Date(),
        decidedBy: 'John Doe',
        context: 'Budget discussion',
        impact: 'Allows additional features',
      };

      const { result: trackedDecision, duration } = await measurePerformance(
        () => aiService.trackDecision('message-1', decision),
        'Decision Tracking'
      );

      expect(trackedDecision).toBeDefined();
      expect(trackedDecision!.id).toBe(decision.id);
      expect(trackedDecision!.title).toBe(decision.title);
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.decisionTracking,
        'Decision Tracking'
      );
    });
  });

  describe('Proactive Suggestions', () => {
    it('should generate proactive suggestions', async () => {
      const context = generateMockContext();
      const threadId = 'proactive-thread';

      const mockChatModel = require('../../functions/src/aiConfig').chatModel;
      mockChatModel.invoke.mockResolvedValue({
        content: JSON.stringify(mockOpenAIResponses.proactiveSuggestions),
      });

      const { result: suggestions, duration } = await measurePerformance(
        () => aiService.getProactiveSuggestions(threadId, context),
        'Proactive Suggestions'
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(validateProactiveSuggestion);
      expectPerformanceWithinLimit(
        duration,
        testConfig.performance.proactiveSuggestions,
        'Proactive Suggestions'
      );
    });

    it('should handle empty context', async () => {
      const mockChatModel = require('../../functions/src/aiConfig').chatModel;
      mockChatModel.invoke.mockResolvedValue({
        content: '[]', // Empty array
      });

      const suggestions = await aiService.getProactiveSuggestions(
        'empty-context',
        {}
      );
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        aiService.generateThreadSummary('error-thread', generateMockMessages(5))
      ).rejects.toThrow('API Error');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit check to return false
      const mockCheckRateLimit =
        require('../../functions/src/aiConfig').checkRateLimit;
      mockCheckRateLimit.mockReturnValue(false);

      await expect(
        aiService.generateThreadSummary(
          'rate-limited-thread',
          generateMockMessages(5)
        )
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Performance Requirements', () => {
    it('should meet response time requirements for all features', async () => {
      const mockOpenAI = require('../../functions/src/aiConfig').openai;
      const mockChatModel = require('../../functions/src/aiConfig').chatModel;

      // Mock fast responses
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Fast response' } }],
      });
      mockChatModel.invoke.mockResolvedValue({
        content: '[]',
      });

      const messages = generateMockMessages(10);
      const context = generateMockContext();

      // Test all features with performance measurement
      const tests = [
        {
          name: 'Thread Summary',
          operation: () =>
            aiService.generateThreadSummary('perf-test', messages),
          limit: testConfig.performance.threadSummary,
        },
        {
          name: 'Action Extraction',
          operation: () => aiService.extractActionItems('perf-test', messages),
          limit: testConfig.performance.actionExtraction,
        },
        {
          name: 'Priority Detection',
          operation: () => aiService.detectPriority('perf-test', messages[0]),
          limit: testConfig.performance.priorityDetection,
        },
        {
          name: 'Smart Search',
          operation: () => aiService.smartSearch('test query', 'perf-test'),
          limit: testConfig.performance.smartSearch,
        },
        {
          name: 'Proactive Suggestions',
          operation: () =>
            aiService.getProactiveSuggestions('perf-test', context),
          limit: testConfig.performance.proactiveSuggestions,
        },
      ];

      for (const test of tests) {
        const { duration } = await measurePerformance(
          test.operation,
          test.name
        );
        expectPerformanceWithinLimit(duration, test.limit, test.name);
      }
    });
  });
});
