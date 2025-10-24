// aiPriorityDetection.ts - AI priority message detection Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiPriorityDetection = onCall(async (request) => {
  try {
    const { messageId, message } = request.data;

    if (!messageId) {
      throw new Error('Message ID is required');
    }

    if (!message) {
      throw new Error('Message data is required');
    }

    const priority = await aiService.detectPriority(messageId, message);

    return {
      success: true,
      priority: priority || 'medium',
      messageId: messageId,
    };
  } catch (error) {
    console.error('Error in aiPriorityDetection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      priority: 'medium',
    };
  }
});
