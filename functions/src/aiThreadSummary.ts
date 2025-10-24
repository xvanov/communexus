// aiThreadSummary.ts - AI thread summarization Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiThreadSummary = onCall(async (request) => {
  try {
    const { threadId, messages } = request.data;

    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const summary = await aiService.generateThreadSummary(threadId, messages);
    
    if (!summary) {
      return { 
        success: false, 
        error: 'Unable to generate summary for empty thread' 
      };
    }

    return {
      success: true,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems,
      generatedAt: summary.generatedAt,
    };
  } catch (error) {
    console.error('Error in aiThreadSummary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});
