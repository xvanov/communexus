// ai.ts - AI feature calls and service abstraction
import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient } from './firebase';
import { AIFeatures } from '../types/AIFeatures';

export async function callHelloWorld(): Promise<any> {
  const fn = httpsCallable(await getFunctionsClient(), 'helloWorld');
  const res = await fn({});
  return res.data;
}

// AI Service abstraction layer
class AIService {
  async generateThreadSummary(
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ThreadSummary | null> {
    try {
      const fn = httpsCallable(await getFunctionsClient(), 'aiThreadSummary');
      const result = await fn({ threadId, messages });
      return (result.data as any).summary || null;
    } catch (error) {
      console.error('Error generating thread summary:', error);
      return null;
    }
  }

  async extractActionItems(
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ActionItem[]> {
    try {
      const fn = httpsCallable(
        await getFunctionsClient(),
        'aiActionExtraction'
      );
      const result = await fn({ threadId, messages });
      return (result.data as any).actionItems || [];
    } catch (error) {
      console.error('Error extracting action items:', error);
      return [];
    }
  }

  async detectPriority(
    messageId: string,
    messageText: string
  ): Promise<AIFeatures.Priority | null> {
    try {
      const fn = httpsCallable(
        await getFunctionsClient(),
        'aiPriorityDetection'
      );
      const result = await fn({ messageId, messageText });
      return (result.data as any).priority || null;
    } catch (error) {
      console.error('Error detecting priority:', error);
      return null;
    }
  }

  async searchMessages(
    query: string,
    threadIds: string[]
  ): Promise<AIFeatures.SearchResult[]> {
    try {
      const fn = httpsCallable(await getFunctionsClient(), 'aiSmartSearch');
      const result = await fn({ query, threadIds });
      return (result.data as any).results || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Alias for compatibility
  async smartSearch(
    query: string,
    threadIds: string[]
  ): Promise<AIFeatures.SearchResult[]> {
    return this.searchMessages(query, threadIds);
  }

  async trackDecision(
    threadId: string,
    messageId: string,
    decision: string
  ): Promise<void> {
    try {
      // For now, just log - implement proper tracking later
      console.log('Tracking decision:', { threadId, messageId, decision });
    } catch (error) {
      console.error('Error tracking decision:', error);
    }
  }

  async getProactiveSuggestions(
    threadId: string,
    recentMessages: any[]
  ): Promise<AIFeatures.ProactiveSuggestion[]> {
    try {
      const fn = httpsCallable(await getFunctionsClient(), 'aiProactiveAgent');
      const result = await fn({ threadId, recentMessages });
      return (result.data as any).suggestions || [];
    } catch (error) {
      console.error('Error getting proactive suggestions:', error);
      return [];
    }
  }
}

export const aiService = new AIService();

// Legacy exports
export const summarizeThread = async (_threadId: string) => {
  // Legacy stub
};

export const extractActionItems = async (_threadId: string) => {
  // Legacy stub
};
