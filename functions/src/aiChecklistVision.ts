// aiChecklistVision.ts - AI checklist vision Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiChecklistVision = onCall(async request => {
  try {
    const { operation, imageUrl, checklistId, detectedTasks, items } = request.data;

    if (!operation) {
      throw new Error('Operation is required');
    }

    switch (operation) {
      case 'analyzeImage': {
        if (!imageUrl || !checklistId) {
          throw new Error('ImageUrl and checklistId are required for image analysis');
        }

        const analysis = await aiService.analyzeImageForChecklist(imageUrl, checklistId);
        return {
          success: true,
          analysis,
        };
      }

      case 'matchItems': {
        if (!detectedTasks || !checklistId || !items) {
          throw new Error('DetectedTasks, checklistId, and items are required for item matching');
        }

        const matches = await aiService.matchImageToChecklistItems(
          detectedTasks,
          checklistId,
          items
        );
        return {
          success: true,
          matches,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in aiChecklistVision:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
});

