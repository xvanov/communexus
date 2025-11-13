// checklistQueryService.ts - Query processing service for checklist status queries
// Extends existing AI infrastructure for checklist query operations
import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient } from './firebase';
import { ChecklistItem } from '../types/Checklist';
import { getChecklist } from './checklistService';

/**
 * Query result interface
 */
export interface QueryResult {
  query: string;
  answer: string;
  nextTask?: ChecklistItem;
  incompleteItems?: ChecklistItem[];
  progress?: {
    total: number;
    completed: number;
    percentage: number;
  };
  relatedItems?: ChecklistItem[];
}

/**
 * Checklist Query Service
 * Handles natural language queries about checklist status
 * 
 * Pattern: Uses Cloud Functions (aiChecklistQuery) which calls backend aiService
 * Similar to how checklistNLPService works
 */
class ChecklistQueryService {
  /**
   * Process a natural language query about checklist status
   * Supports queries like: "what's next?", "show incomplete", "how many done?"
   */
  async processChecklistQuery(
    query: string,
    checklistId: string
  ): Promise<QueryResult> {
    try {
      if (!query || !query.trim()) {
        throw new Error('Query is required');
      }

      // Get checklist for context
      const checklist = await getChecklist(checklistId);
      if (!checklist) {
        throw new Error('Checklist not found');
      }

      // For simple queries, use direct logic
      const lowerQuery = query.toLowerCase().trim();
      
      // "what's next?" or "what is next?"
      if (lowerQuery.includes("what's next") || lowerQuery.includes("what is next") || lowerQuery === "next") {
        const nextTask = await this.getNextTask(checklistId);
        return {
          query,
          answer: nextTask
            ? `Next task: ${nextTask.title}`
            : 'All tasks are complete!',
          nextTask: nextTask || undefined,
        };
      }

      // "show incomplete" or "show pending"
      if (lowerQuery.includes("show incomplete") || lowerQuery.includes("show pending") || lowerQuery.includes("incomplete")) {
        const incompleteItems = checklist.items.filter(
          item => item.status !== 'completed'
        );
        const sortedIncomplete = incompleteItems.sort((a, b) => a.order - b.order);
        
        return {
          query,
          answer: incompleteItems.length === 0
            ? 'All tasks are complete!'
            : `Found ${incompleteItems.length} incomplete task${incompleteItems.length > 1 ? 's' : ''}: ${sortedIncomplete.map(i => i.title).join(', ')}`,
          incompleteItems: sortedIncomplete,
        };
      }

      // "how many done?" or "how many complete?"
      if (lowerQuery.includes("how many") && (lowerQuery.includes("done") || lowerQuery.includes("complete"))) {
        const completedCount = checklist.items.filter(
          item => item.status === 'completed'
        ).length;
        const totalCount = checklist.items.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        return {
          query,
          answer: `${completedCount} of ${totalCount} tasks complete${percentage > 0 ? ` (${percentage}%)` : ''}`,
          progress: {
            total: totalCount,
            completed: completedCount,
            percentage,
          },
        };
      }

      // For other queries, use AI processing via Cloud Function
      const fn = httpsCallable(await getFunctionsClient(), 'aiChecklistQuery');
      const result = await fn({
        operation: 'processQuery',
        query,
        checklistId,
        items: checklist.items.map(item => ({
          id: item.id,
          title: item.title,
          status: item.status,
          order: item.order,
        })),
      });

      const queryResult = (result.data as any)?.result;
      
      if (!queryResult) {
        throw new Error('No query result returned');
      }

      // Reconstruct ChecklistItem objects if present
      if (queryResult.nextTask) {
        queryResult.nextTask = checklist.items.find(
          item => item.id === queryResult.nextTask.id
        );
      }
      if (queryResult.incompleteItems) {
        queryResult.incompleteItems = queryResult.incompleteItems
          .map((item: any) => checklist.items.find(i => i.id === item.id))
          .filter((item: ChecklistItem | undefined): item is ChecklistItem => item !== undefined);
      }
      if (queryResult.relatedItems) {
        queryResult.relatedItems = queryResult.relatedItems
          .map((item: any) => checklist.items.find(i => i.id === item.id))
          .filter((item: ChecklistItem | undefined): item is ChecklistItem => item !== undefined);
      }

      return queryResult as QueryResult;
    } catch (error) {
      console.error('Error processing checklist query:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to process query. Please try again.'
      );
    }
  }

  /**
   * Get the next uncompleted task (highest priority)
   * Returns the first uncompleted item by order, or null if all complete
   */
  async getNextTask(checklistId: string): Promise<ChecklistItem | null> {
    try {
      const checklist = await getChecklist(checklistId);
      if (!checklist || !checklist.items || checklist.items.length === 0) {
        return null;
      }

      // Sort items by order and find first uncompleted
      const sortedItems = [...checklist.items].sort((a, b) => a.order - b.order);
      const nextTask = sortedItems.find(item => item.status !== 'completed');

      return nextTask || null;
    } catch (error) {
      console.error('Error getting next task:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to get next task. Please try again.'
      );
    }
  }
}

// Export singleton instance
export const checklistQueryService = new ChecklistQueryService();


