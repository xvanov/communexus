import { useState, useCallback } from 'react';
import { AIFeatures } from '../types/AIFeatures';
import { aiService } from '../services/ai';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateThreadSummary = useCallback(async (
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ThreadSummary | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const summary = await aiService.generateThreadSummary(threadId, messages);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const extractActionItems = useCallback(async (
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ActionItem[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const actionItems = await aiService.extractActionItems(threadId, messages);
      return actionItems;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract action items';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const detectPriority = useCallback(async (
    messageId: string,
    message: any
  ): Promise<AIFeatures.PriorityLevel | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const priority = await aiService.detectPriority(messageId, message);
      return priority;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect priority';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const smartSearch = useCallback(async (
    query: string,
    threadId?: string
  ): Promise<AIFeatures.SearchResult[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await aiService.smartSearch(query, threadId);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform smart search';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const trackDecision = useCallback(async (
    messageId: string,
    decision: AIFeatures.Decision
  ): Promise<AIFeatures.Decision | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const trackedDecision = await aiService.trackDecision(messageId, decision);
      return trackedDecision;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track decision';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProactiveSuggestions = useCallback(async (
    threadId: string,
    context: any
  ): Promise<AIFeatures.ProactiveSuggestion[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const suggestions = await aiService.getProactiveSuggestions(threadId, context);
      return suggestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get proactive suggestions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    generateThreadSummary,
    extractActionItems,
    detectPriority,
    smartSearch,
    trackDecision,
    getProactiveSuggestions,
    clearError,
  };
};
