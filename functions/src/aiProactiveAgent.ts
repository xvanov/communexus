// aiProactiveAgent.ts - LangChain proactive assistant Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiProactiveAgent = onCall(async request => {
  try {
    const { threadId, context } = request.data;

    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    if (!context) {
      throw new Error('Context data is required');
    }

    const suggestions = await aiService.getProactiveSuggestions(
      threadId,
      context
    );

    return {
      success: true,
      suggestions: suggestions,
      count: suggestions.length,
      threadId: threadId,
    };
  } catch (error) {
    console.error('Error in aiProactiveAgent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestions: [],
    };
  }
});
