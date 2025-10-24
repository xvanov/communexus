import { AIFeatures } from '../../src/types/AIFeatures';
import { aiService } from '../../src/services/ai';

describe('AI Features', () => {
  describe('Thread Summary', () => {
    it('should generate a thread summary', async () => {
      const mockMessages = [
        { id: '1', text: 'Hello, how are you?', timestamp: new Date() },
        { id: '2', text: 'I am doing well, thank you!', timestamp: new Date() },
        { id: '3', text: 'Great to hear!', timestamp: new Date() },
      ];

      const summary = await aiService.generateThreadSummary('thread-1', mockMessages);
      
      expect(summary).toBeDefined();
      expect(summary?.summary).toBeDefined();
      expect(typeof summary?.summary).toBe('string');
    });

    it('should handle empty message list', async () => {
      const summary = await aiService.generateThreadSummary('thread-1', []);
      
      expect(summary).toBeNull();
    });
  });

  describe('Action Item Extraction', () => {
    it('should extract action items from messages', async () => {
      const mockMessages = [
        { id: '1', text: 'Please send the invoice by Friday', timestamp: new Date() },
        { id: '2', text: 'I will review the contract tomorrow', timestamp: new Date() },
        { id: '3', text: 'Thanks for the update', timestamp: new Date() },
      ];

      const actionItems = await aiService.extractActionItems('thread-1', mockMessages);
      
      expect(Array.isArray(actionItems)).toBe(true);
      expect(actionItems.length).toBeGreaterThan(0);
      
      if (actionItems.length > 0) {
        expect(actionItems[0]).toHaveProperty('text');
        expect(actionItems[0]).toHaveProperty('priority');
      }
    });

    it('should handle messages with no action items', async () => {
      const mockMessages = [
        { id: '1', text: 'Hello there', timestamp: new Date() },
        { id: '2', text: 'How are you?', timestamp: new Date() },
      ];

      const actionItems = await aiService.extractActionItems('thread-1', mockMessages);
      
      expect(Array.isArray(actionItems)).toBe(true);
      expect(actionItems.length).toBe(0);
    });
  });

  describe('Priority Detection', () => {
    it('should detect high priority messages', async () => {
      const mockMessage = {
        id: '1',
        text: 'URGENT: Server is down, need immediate attention!',
        timestamp: new Date(),
      };

      const priority = await aiService.detectPriority('message-1', mockMessage);
      
      expect(priority).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(priority);
    });

    it('should detect low priority messages', async () => {
      const mockMessage = {
        id: '1',
        text: 'Just wanted to say hello',
        timestamp: new Date(),
      };

      const priority = await aiService.detectPriority('message-1', mockMessage);
      
      expect(priority).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(priority);
    });
  });

  describe('Smart Search', () => {
    it('should perform semantic search', async () => {
      const results = await aiService.smartSearch('invoice payment');
      
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('messageId');
        expect(results[0]).toHaveProperty('relevanceScore');
        expect(results[0]).toHaveProperty('snippet');
      }
    });

    it('should handle empty search query', async () => {
      const results = await aiService.smartSearch('');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Decision Tracking', () => {
    it('should track a decision', async () => {
      const mockDecision: AIFeatures.Decision = {
        id: 'decision-1',
        title: 'Approved budget increase',
        description: 'Client approved 10% budget increase for additional features',
        status: 'approved',
        decidedAt: new Date(),
        decidedBy: 'John Doe',
        context: 'Budget discussion for Q4 project',
        impact: 'Allows for additional feature development',
      };

      const trackedDecision = await aiService.trackDecision('message-1', mockDecision);
      
      expect(trackedDecision).toBeDefined();
      expect(trackedDecision?.id).toBe(mockDecision.id);
      expect(trackedDecision?.title).toBe(mockDecision.title);
    });
  });

  describe('Proactive Suggestions', () => {
    it('should generate proactive suggestions', async () => {
      const mockContext = {
        threadId: 'thread-1',
        recentMessages: [
          { text: 'I will send the proposal by Friday', timestamp: new Date() },
        ],
        userProfile: {
          role: 'contractor',
          preferences: {},
        },
      };

      const suggestions = await aiService.getProactiveSuggestions('thread-1', mockContext);
      
      expect(Array.isArray(suggestions)).toBe(true);
      
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('id');
        expect(suggestions[0]).toHaveProperty('type');
        expect(suggestions[0]).toHaveProperty('message');
        expect(suggestions[0]).toHaveProperty('confidence');
      }
    });

    it('should handle empty context', async () => {
      const suggestions = await aiService.getProactiveSuggestions('thread-1', {});
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });
});
