// AI Test Utilities for mocking OpenAI and LangChain
import { AIFeatures } from '../../src/types/AIFeatures';

// Mock OpenAI responses
export const mockOpenAIResponses = {
  threadSummary: {
    summary:
      'This is a mock thread summary discussing project updates and action items.',
    keyPoints: [
      'Project timeline discussed',
      'Budget approved',
      'Next meeting scheduled',
    ],
    actionItems: ['Send invoice by Friday', 'Review contract tomorrow'],
  },

  actionItems: [
    {
      id: 'action_1',
      text: 'Send invoice by Friday',
      priority: 'high' as AIFeatures.PriorityLevel,
      assignee: 'John Doe',
      dueDate: new Date('2024-12-27'),
      status: 'pending' as AIFeatures.ActionItemStatus,
      createdAt: new Date(),
    },
    {
      id: 'action_2',
      text: 'Review contract tomorrow',
      priority: 'medium' as AIFeatures.PriorityLevel,
      assignee: 'Jane Smith',
      dueDate: new Date('2024-12-26'),
      status: 'pending' as AIFeatures.ActionItemStatus,
      createdAt: new Date(),
    },
  ],

  priorityDetection: 'high' as AIFeatures.PriorityLevel,

  searchResults: [
    {
      messageId: 'msg_1',
      threadId: 'thread_1',
      snippet: 'Invoice payment discussion',
      relevanceScore: 0.95,
      context: 'Payment terms and due dates',
    },
    {
      messageId: 'msg_2',
      threadId: 'thread_1',
      snippet: 'Contract review needed',
      relevanceScore: 0.87,
      context: 'Legal document review',
    },
  ],

  proactiveSuggestions: [
    {
      id: 'suggestion_1',
      type: 'follow_up' as AIFeatures.SuggestionType,
      message: 'Follow up on invoice payment status',
      confidence: 0.9,
      createdAt: new Date(),
    },
    {
      id: 'suggestion_2',
      type: 'reminder' as AIFeatures.SuggestionType,
      message: 'Remind team about contract review deadline',
      confidence: 0.8,
      createdAt: new Date(),
    },
  ],
};

// Mock OpenAI client
export class MockOpenAI {
  chat = {
    completions: {
      create: jest.fn().mockImplementation(async params => {
        const { messages } = params;
        const lastMessage = messages[messages.length - 1];

        // Determine response based on message content
        if (lastMessage.content.includes('summarize')) {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify(mockOpenAIResponses.threadSummary),
                },
              },
            ],
          };
        }

        if (lastMessage.content.includes('action items')) {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify(mockOpenAIResponses.actionItems),
                },
              },
            ],
          };
        }

        if (lastMessage.content.includes('priority')) {
          return {
            choices: [
              {
                message: {
                  content: mockOpenAIResponses.priorityDetection,
                },
              },
            ],
          };
        }

        if (lastMessage.content.includes('search')) {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify(mockOpenAIResponses.searchResults),
                },
              },
            ],
          };
        }

        // Default response
        return {
          choices: [
            {
              message: {
                content: 'Mock AI response',
              },
            },
          ],
        };
      }),
    },
  };
}

// Mock LangChain ChatOpenAI
export class MockChatOpenAI {
  invoke = jest.fn().mockImplementation(async messages => {
    return {
      content: JSON.stringify(mockOpenAIResponses.proactiveSuggestions),
    };
  });
}

// Test data generators
export const generateMockMessages = (count: number = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg_${index + 1}`,
    text: `Mock message ${index + 1} content`,
    timestamp: new Date(Date.now() - (count - index) * 60000), // 1 minute apart
    senderId: `user_${(index % 2) + 1}`,
    threadId: 'thread_1',
  }));
};

export const generateMockThread = (messageCount: number = 10) => {
  return {
    id: 'thread_1',
    name: 'Mock Project Thread',
    participants: ['user_1', 'user_2'],
    messages: generateMockMessages(messageCount),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const generateMockContext = () => {
  return {
    threadId: 'thread_1',
    recentMessages: generateMockMessages(5),
    userProfile: {
      role: 'contractor',
      preferences: {
        notifications: true,
        aiFeatures: true,
      },
    },
    projectContext: {
      name: 'Mock Project',
      status: 'active',
      deadline: new Date('2024-12-31'),
    },
  };
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  console.log(`${operationName} completed in ${duration}ms`);
  return { result, duration };
};

export const expectPerformanceWithinLimit = (
  duration: number,
  limitMs: number,
  operationName: string
) => {
  expect(duration).toBeLessThanOrEqual(limitMs);
  if (duration > limitMs) {
    console.warn(
      `${operationName} exceeded performance limit: ${duration}ms > ${limitMs}ms`
    );
  }
};

// Test configuration
export const testConfig = {
  performance: {
    threadSummary: 2000, // 2 seconds
    actionExtraction: 1500, // 1.5 seconds
    priorityDetection: 1000, // 1 second
    smartSearch: 2000, // 2 seconds
    proactiveSuggestions: 3000, // 3 seconds
  },
  limits: {
    maxMessages: 50,
    maxActionItems: 20,
    maxSearchResults: 10,
    maxSuggestions: 5,
  },
};

// Error simulation utilities
export const simulateAPIError = (
  errorType: 'rate_limit' | 'timeout' | 'invalid_key' | 'network'
) => {
  const errors = {
    rate_limit: new Error('Rate limit exceeded'),
    timeout: new Error('Request timeout'),
    invalid_key: new Error('Invalid API key'),
    network: new Error('Network error'),
  };

  throw errors[errorType];
};

export const simulateSlowResponse = (delayMs: number = 5000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('Slow response');
    }, delayMs);
  });
};

// Validation utilities
export const validateThreadSummary = (summary: AIFeatures.ThreadSummary) => {
  expect(summary).toBeDefined();
  expect(summary.id).toBeDefined();
  expect(summary.threadId).toBeDefined();
  expect(summary.summary).toBeDefined();
  expect(typeof summary.summary).toBe('string');
  expect(summary.summary.length).toBeGreaterThan(0);
  expect(summary.generatedAt).toBeInstanceOf(Date);
  expect(Array.isArray(summary.keyPoints)).toBe(true);
  expect(Array.isArray(summary.actionItems)).toBe(true);
};

export const validateActionItem = (actionItem: AIFeatures.ActionItem) => {
  expect(actionItem).toBeDefined();
  expect(actionItem.id).toBeDefined();
  expect(actionItem.text).toBeDefined();
  expect(typeof actionItem.text).toBe('string');
  expect(actionItem.text.length).toBeGreaterThan(0);
  expect(['high', 'medium', 'low']).toContain(actionItem.priority);
  expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(
    actionItem.status
  );
  expect(actionItem.createdAt).toBeInstanceOf(Date);
};

export const validateSearchResult = (result: AIFeatures.SearchResult) => {
  expect(result).toBeDefined();
  expect(result.messageId).toBeDefined();
  expect(result.threadId).toBeDefined();
  expect(result.snippet).toBeDefined();
  expect(typeof result.snippet).toBe('string');
  expect(result.snippet.length).toBeGreaterThan(0);
  expect(result.relevanceScore).toBeDefined();
  expect(typeof result.relevanceScore).toBe('number');
  expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
  expect(result.relevanceScore).toBeLessThanOrEqual(1);
};

export const validateProactiveSuggestion = (
  suggestion: AIFeatures.ProactiveSuggestion
) => {
  expect(suggestion).toBeDefined();
  expect(suggestion.id).toBeDefined();
  expect(['follow_up', 'reminder', 'suggestion', 'alert']).toContain(
    suggestion.type
  );
  expect(suggestion.message).toBeDefined();
  expect(typeof suggestion.message).toBe('string');
  expect(suggestion.message.length).toBeGreaterThan(0);
  expect(suggestion.confidence).toBeDefined();
  expect(typeof suggestion.confidence).toBe('number');
  expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
  expect(suggestion.confidence).toBeLessThanOrEqual(1);
  expect(suggestion.createdAt).toBeInstanceOf(Date);
};
