// aiActionExtraction.ts - AI action item extraction Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiActionExtraction = onCall(async request => {
  try {
    const { threadId, messages } = request.data;

    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const actionItems = await aiService.extractActionItems(threadId, messages);

    return {
      success: true,
      actionItems: actionItems,
      count: actionItems.length,
    };
  } catch (error) {
    console.error('Error in aiActionExtraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      actionItems: [],
    };
  }
});
