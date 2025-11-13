// visionAnalysisService.ts - Vision analysis service for checklist image analysis
// Extends existing AI infrastructure for vision analysis operations
import { ChecklistItem } from '../types/Checklist';

/**
 * Confidence level for image analysis results
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Detected task from image analysis
 */
export interface DetectedTask {
  description: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-1
}

/**
 * Image analysis result
 */
export interface ImageAnalysisResult {
  detectedTasks: DetectedTask[];
  completionStatus: 'complete' | 'incomplete' | 'partial' | 'unknown';
  summary: string;
}

/**
 * Matched checklist item with confidence
 */
export interface MatchedItem {
  item: ChecklistItem;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-1
  reasoning?: string;
}

/**
 * Vision Analysis Service
 * Extends existing AI infrastructure for checklist-specific vision operations
 * 
 * Pattern: Uses Cloud Functions (aiChecklistVision) which calls backend aiService
 * Similar to how checklistNLPService works
 */
class VisionAnalysisService {
  /**
   * Analyze an image for checklist completion detection
   * Uses GPT-4 Vision API to detect tasks and completion status
   */
  async analyzeImageForChecklist(
    imageUrl: string,
    checklistId: string
  ): Promise<ImageAnalysisResult> {
    try {
      // Validate image URL
      if (!imageUrl || !imageUrl.trim()) {
        throw new Error('Image URL is required');
      }

      // Validate URL format (more flexible)
      const trimmedUrl = imageUrl.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        throw new Error('Invalid image URL format. URL must start with http:// or https://');
      }
      
      // Try to create URL object to validate format
      try {
        new URL(trimmedUrl);
      } catch (urlError) {
        throw new Error('Invalid image URL format. Please enter a valid URL (e.g., https://example.com/image.jpg)');
      }

      // Use direct HTTP call (httpsCallable has issues with v2 functions in emulator)
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiChecklistVision'
        : 'https://us-central1-communexus.cloudfunctions.net/aiChecklistVision';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            operation: 'analyzeImage',
            imageUrl: trimmedUrl,
            checklistId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.result || result.data;

      // Check if function returned an error
      if (data?.success === false) {
        const errorMsg = data?.error || 'Unknown error from Cloud Function';
        throw new Error(errorMsg);
      }

      const analysis = data?.analysis;
      
      if (!analysis) {
        throw new Error('No analysis result returned from Cloud Function');
      }

      return analysis as ImageAnalysisResult;
    } catch (error: any) {
      console.error('Error analyzing image for checklist:', error);
      
      // Provide helpful error messages
      if (error?.message?.includes('not-found') || 
          error?.message?.includes('NOT_FOUND') ||
          error?.message?.includes('404')) {
        throw new Error('Cloud Function "aiChecklistVision" not found. Please:\n1. Ensure Firebase emulators are running (npx firebase emulators:start)\n2. Restart emulators to load new functions\n3. Check Functions emulator UI: http://127.0.0.1:4000');
      }
      
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to analyze image. Please try again.'
      );
    }
  }

  /**
   * Match detected tasks from image analysis to checklist items
   * Uses semantic similarity and exact matching
   */
  async matchImageToChecklistItems(
    analysis: ImageAnalysisResult,
    checklistId: string
  ): Promise<MatchedItem[]> {
    try {
      if (!analysis || !analysis.detectedTasks || analysis.detectedTasks.length === 0) {
        return [];
      }

      // Get checklist items
      const { getChecklist } = await import('./checklistService');
      const checklist = await getChecklist(checklistId);
      
      if (!checklist || !checklist.items || checklist.items.length === 0) {
        return [];
      }

      // Use direct HTTP call (httpsCallable has issues with v2 functions in emulator)
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiChecklistVision'
        : 'https://us-central1-communexus.cloudfunctions.net/aiChecklistVision';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            operation: 'matchItems',
            detectedTasks: analysis.detectedTasks.map(task => ({
              description: task.description,
              confidenceScore: task.confidenceScore,
            })),
            checklistId,
            items: checklist.items.map(item => ({
              id: item.id,
              title: item.title,
              status: item.status,
              order: item.order,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.result || result.data;
      const matches = data?.matches || [];
      
      // Reconstruct full ChecklistItem objects
      const matchedItems: MatchedItem[] = matches
        .map((match: any) => {
          const item = checklist.items.find(i => i.id === match.itemId);
          if (!item) return null;

          return {
            item,
            confidence: match.confidence as ConfidenceLevel,
            confidenceScore: match.confidenceScore,
            reasoning: match.reasoning,
          };
        })
        .filter((m: MatchedItem | null): m is MatchedItem => m !== null);

      return matchedItems;
    } catch (error) {
      console.error('Error matching image to checklist items:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to match image to checklist items. Please try again.'
      );
    }
  }

  /**
   * Link a photo to a checklist item
   * Adds the photo URL to the item's mediaAttachments array
   */
  async linkPhotoToItem(
    checklistId: string,
    itemId: string,
    photoUrl: string
  ): Promise<void> {
    try {
      if (!checklistId || !itemId || !photoUrl) {
        throw new Error('checklistId, itemId, and photoUrl are required');
      }

      // Import checklistService dynamically to avoid circular dependencies
      const { getChecklist, updateChecklistItem } = await import('./checklistService');
      
      const checklist = await getChecklist(checklistId);
      if (!checklist) {
        throw new Error('Checklist not found');
      }

      const item = checklist.items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Checklist item not found');
      }

      // Add photo URL to mediaAttachments if not already present
      const mediaAttachments = item.mediaAttachments || [];
      if (!mediaAttachments.includes(photoUrl)) {
        await updateChecklistItem(checklistId, itemId, {
          mediaAttachments: [...mediaAttachments, photoUrl],
        });
      }
    } catch (error) {
      console.error('Error linking photo to item:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to link photo to item. Please try again.'
      );
    }
  }
}

// Export singleton instance
export const visionAnalysisService = new VisionAnalysisService();

