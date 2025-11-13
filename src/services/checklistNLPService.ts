// checklistNLPService.ts - Natural Language Processing for Checklist operations
// Extends existing AI infrastructure for checklist-specific NLP operations
import { ChecklistItem } from '../types/Checklist';

/**
 * Checklist intent types
 */
export type ChecklistIntent = 'create_item' | 'mark_complete' | 'query_status' | 'unknown';

/**
 * Command preview interface
 * Shows user what action will be taken before execution
 */
export interface CommandPreview {
  intent: ChecklistIntent;
  matchedItem?: ChecklistItem;
  additionalMatches?: Array<{ id: string; title: string; confidence: number }>; // For multiple matches
  suggestedAction: string;
  confidence: number;
  newItemTitle?: string; // For create_item intent
  queryResult?: string; // For query_status intent
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  item?: ChecklistItem;
  error?: string;
  message?: string;
}

/**
 * Checklist NLP Service
 * Extends existing AI infrastructure for checklist-specific NLP operations
 * 
 * Pattern: Uses Cloud Functions (aiChecklistNLP) which calls backend aiService
 * Similar to how aiService.generateThreadSummary() works
 */
class ChecklistNLPService {
  /**
   * Classify user intent from natural language text
   * Returns: create_item, mark_complete, query_status, or unknown
   */
  async classifyChecklistIntent(text: string): Promise<ChecklistIntent> {
    try {
      // Use direct HTTP call (httpsCallable has issues with v2 functions in emulator)
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiChecklistNLP'
        : 'https://us-central1-communexus.cloudfunctions.net/aiChecklistNLP';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            operation: 'classifyIntent',
            text,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.result || result.data;
      const intent = data?.intent || 'unknown';
      
      // Validate intent is one of the allowed types
      if (['create_item', 'mark_complete', 'query_status', 'unknown'].includes(intent)) {
        return intent as ChecklistIntent;
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error classifying checklist intent:', error);
      return 'unknown';
    }
  }

  /**
   * Match natural language text to a checklist item
   * Uses semantic similarity and exact matching
   */
  async matchChecklistItem(
    text: string,
    checklistId: string,
    items: ChecklistItem[]
  ): Promise<ChecklistItem | null> {
    try {
      // Use direct HTTP call (httpsCallable has issues with v2 functions in emulator)
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiChecklistNLP'
        : 'https://us-central1-communexus.cloudfunctions.net/aiChecklistNLP';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            operation: 'matchItem',
            text,
            checklistId,
            items: items.map(item => ({
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
      const matchedItem = data?.matchedItem;
      
      if (!matchedItem) {
        return null;
      }
      
      // Find the full item object from the items array
      return items.find(item => item.id === matchedItem.id) || null;
    } catch (error) {
      console.error('Error matching checklist item:', error);
      return null;
    }
  }

  /**
   * Process a natural language command
   * Orchestrates: intent classification → item matching → preview generation
   */
  async processChecklistCommand(
    text: string,
    checklistId: string,
    items: ChecklistItem[]
  ): Promise<CommandPreview> {
    try {
      // Use direct HTTP call (httpsCallable has issues with v2 functions in emulator)
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiChecklistNLP'
        : 'https://us-central1-communexus.cloudfunctions.net/aiChecklistNLP';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            operation: 'processCommand',
            text,
            checklistId,
            items: items.map(item => ({
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
      const preview = data?.preview;
      
      if (!preview) {
        throw new Error('No preview generated');
      }
      
      // Reconstruct matchedItem if present
      let matchedItem: ChecklistItem | undefined = undefined;
      if (preview.matchedItem) {
        matchedItem = items.find(item => item.id === preview.matchedItem.id);
      }
      
      const commandPreview: CommandPreview = {
        intent: preview.intent as ChecklistIntent,
        suggestedAction: preview.suggestedAction,
        confidence: preview.confidence || 0,
      };
      
      if (matchedItem) {
        commandPreview.matchedItem = matchedItem;
      }
      if (preview.additionalMatches) {
        commandPreview.additionalMatches = preview.additionalMatches;
      }
      if (preview.newItemTitle) {
        commandPreview.newItemTitle = preview.newItemTitle;
      }
      if (preview.queryResult) {
        commandPreview.queryResult = preview.queryResult;
      }
      
      return commandPreview;
    } catch (error) {
      console.error('Error processing checklist command:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to process command. Please try again.'
      );
    }
  }

  /**
   * Execute a command preview
   * Calls checklistService methods to perform the actual operation
   */
  async executeCommand(
    preview: CommandPreview,
    checklistId: string,
    userId?: string
  ): Promise<CommandResult> {
    try {
      // Import checklistService dynamically to avoid circular dependencies
      const { markItemComplete, createChecklistItem } = await import('./checklistService');

      if (preview.intent === 'mark_complete' && preview.matchedItem) {
        const item = await markItemComplete(
          checklistId,
          preview.matchedItem.id,
          userId
        );
        return {
          success: true,
          item,
          message: `Marked "${preview.matchedItem.title}" as complete`,
        };
      }

      if (preview.intent === 'create_item' && preview.newItemTitle) {
        // Get checklist to determine next order
        const { getChecklist } = await import('./checklistService');
        const checklist = await getChecklist(checklistId);
        
        if (!checklist) {
          throw new Error('Checklist not found');
        }

        const item = await createChecklistItem(checklistId, {
          checklistId,
          title: preview.newItemTitle,
          status: 'pending',
          order: checklist.items.length,
        });

        return {
          success: true,
          item,
          message: `Added new item: "${preview.newItemTitle}"`,
        };
      }

      if (preview.intent === 'query_status') {
        // Query status doesn't modify anything, just returns the result
        return {
          success: true,
          message: preview.queryResult || preview.suggestedAction,
        };
      }

      return {
        success: false,
        error: 'Unknown intent or missing required data',
      };
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute command. Please try again.',
      };
    }
  }
}

// Export singleton instance
export const checklistNLPService = new ChecklistNLPService();

