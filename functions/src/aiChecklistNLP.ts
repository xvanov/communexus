// aiChecklistNLP.ts - AI checklist NLP Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiChecklistNLP = onCall(async request => {
  try {
    const { operation, text, checklistId, items } = request.data;

    if (!operation) {
      throw new Error('Operation is required');
    }

    if (!text && operation !== 'processCommand') {
      throw new Error('Text is required');
    }

    switch (operation) {
      case 'classifyIntent': {
        if (!text) {
          throw new Error('Text is required for intent classification');
        }

        const intent = await aiService.classifyChecklistIntent(text);
        return {
          success: true,
          intent,
        };
      }

      case 'matchItem': {
        if (!text || !checklistId || !items) {
          throw new Error('Text, checklistId, and items are required for item matching');
        }

        const matchedItem = await aiService.matchChecklistItem(text, checklistId, items);
        return {
          success: true,
          matchedItem: matchedItem || null,
        };
      }

      case 'processCommand': {
        if (!text || !checklistId || !items) {
          throw new Error('Text, checklistId, and items are required for command processing');
        }

        const preview = await aiService.processChecklistCommand(text, checklistId, items);
        return {
          success: true,
          preview,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in aiChecklistNLP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});


