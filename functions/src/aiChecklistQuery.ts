// aiChecklistQuery.ts - AI checklist query Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiChecklistQuery = onCall(async request => {
  try {
    const { operation, query, checklistId, items } = request.data;

    if (!operation) {
      throw new Error('Operation is required');
    }

    switch (operation) {
      case 'processQuery': {
        if (!query || !checklistId || !items) {
          throw new Error('Query, checklistId, and items are required for query processing');
        }

        const result = await aiService.processChecklistQuery(query, checklistId, items);
        return {
          success: true,
          result,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in aiChecklistQuery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

