import { create } from 'zustand';
import { AIFeatures } from '../types/AIFeatures';

interface AIState {
  // Thread summaries cache
  threadSummaries: Record<string, AIFeatures.ThreadSummary>;
  
  // Action items cache
  actionItems: Record<string, AIFeatures.ActionItem[]>;
  
  // Priority levels cache
  messagePriorities: Record<string, AIFeatures.PriorityLevel>;
  
  // Search results cache
  searchResults: Record<string, AIFeatures.SearchResult[]>;
  
  // Decisions cache
  decisions: Record<string, AIFeatures.Decision>;
  
  // Proactive suggestions cache
  proactiveSuggestions: Record<string, AIFeatures.ProactiveSuggestion[]>;
  
  // Loading states
  loading: {
    summaries: Record<string, boolean>;
    actionItems: Record<string, boolean>;
    priorities: Record<string, boolean>;
    search: Record<string, boolean>;
    decisions: Record<string, boolean>;
    suggestions: Record<string, boolean>;
  };
  
  // Error states
  errors: Record<string, string>;
}

interface AIActions {
  // Thread summary actions
  setThreadSummary: (threadId: string, summary: AIFeatures.ThreadSummary) => void;
  getThreadSummary: (threadId: string) => AIFeatures.ThreadSummary | undefined;
  setSummaryLoading: (threadId: string, loading: boolean) => void;
  setSummaryError: (threadId: string, error: string) => void;
  
  // Action items actions
  setActionItems: (threadId: string, actionItems: AIFeatures.ActionItem[]) => void;
  getActionItems: (threadId: string) => AIFeatures.ActionItem[];
  addActionItem: (threadId: string, actionItem: AIFeatures.ActionItem) => void;
  updateActionItem: (threadId: string, actionItemId: string, updates: Partial<AIFeatures.ActionItem>) => void;
  removeActionItem: (threadId: string, actionItemId: string) => void;
  setActionItemsLoading: (threadId: string, loading: boolean) => void;
  setActionItemsError: (threadId: string, error: string) => void;
  
  // Priority actions
  setMessagePriority: (messageId: string, priority: AIFeatures.PriorityLevel) => void;
  getMessagePriority: (messageId: string) => AIFeatures.PriorityLevel | undefined;
  setPriorityLoading: (messageId: string, loading: boolean) => void;
  setPriorityError: (messageId: string, error: string) => void;
  
  // Search actions
  setSearchResults: (query: string, results: AIFeatures.SearchResult[]) => void;
  getSearchResults: (query: string) => AIFeatures.SearchResult[];
  setSearchLoading: (query: string, loading: boolean) => void;
  setSearchError: (query: string, error: string) => void;
  
  // Decision actions
  setDecision: (messageId: string, decision: AIFeatures.Decision) => void;
  getDecision: (messageId: string) => AIFeatures.Decision | undefined;
  setDecisionLoading: (messageId: string, loading: boolean) => void;
  setDecisionError: (messageId: string, error: string) => void;
  
  // Proactive suggestions actions
  setProactiveSuggestions: (threadId: string, suggestions: AIFeatures.ProactiveSuggestion[]) => void;
  getProactiveSuggestions: (threadId: string) => AIFeatures.ProactiveSuggestion[];
  addProactiveSuggestion: (threadId: string, suggestion: AIFeatures.ProactiveSuggestion) => void;
  removeProactiveSuggestion: (threadId: string, suggestionId: string) => void;
  setSuggestionsLoading: (threadId: string, loading: boolean) => void;
  setSuggestionsError: (threadId: string, error: string) => void;
  
  // Utility actions
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  clearCache: () => void;
}

export const useAIStore = create<AIState & AIActions>((set, get) => ({
  // Initial state
  threadSummaries: {},
  actionItems: {},
  messagePriorities: {},
  searchResults: {},
  decisions: {},
  proactiveSuggestions: {},
  loading: {
    summaries: {},
    actionItems: {},
    priorities: {},
    search: {},
    decisions: {},
    suggestions: {},
  },
  errors: {},

  // Thread summary actions
  setThreadSummary: (threadId, summary) =>
    set((state) => ({
      threadSummaries: { ...state.threadSummaries, [threadId]: summary },
    })),
  
  getThreadSummary: (threadId) => get().threadSummaries[threadId],
  
  setSummaryLoading: (threadId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        summaries: { ...state.loading.summaries, [threadId]: loading },
      },
    })),
  
  setSummaryError: (threadId, error) =>
    set((state) => ({
      errors: { ...state.errors, [`summary_${threadId}`]: error },
    })),

  // Action items actions
  setActionItems: (threadId, actionItems) =>
    set((state) => ({
      actionItems: { ...state.actionItems, [threadId]: actionItems },
    })),
  
  getActionItems: (threadId) => get().actionItems[threadId] || [],
  
  addActionItem: (threadId, actionItem) =>
    set((state) => ({
      actionItems: {
        ...state.actionItems,
        [threadId]: [...(state.actionItems[threadId] || []), actionItem],
      },
    })),
  
  updateActionItem: (threadId, actionItemId, updates) =>
    set((state) => {
      const currentItems = state.actionItems[threadId] || [];
      const updatedItems = currentItems.map((item) =>
        item.id === actionItemId ? { ...item, ...updates } : item
      );
      return {
        actionItems: { ...state.actionItems, [threadId]: updatedItems },
      };
    }),
  
  removeActionItem: (threadId, actionItemId) =>
    set((state) => {
      const currentItems = state.actionItems[threadId] || [];
      const filteredItems = currentItems.filter((item) => item.id !== actionItemId);
      return {
        actionItems: { ...state.actionItems, [threadId]: filteredItems },
      };
    }),
  
  setActionItemsLoading: (threadId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        actionItems: { ...state.loading.actionItems, [threadId]: loading },
      },
    })),
  
  setActionItemsError: (threadId, error) =>
    set((state) => ({
      errors: { ...state.errors, [`actionItems_${threadId}`]: error },
    })),

  // Priority actions
  setMessagePriority: (messageId, priority) =>
    set((state) => ({
      messagePriorities: { ...state.messagePriorities, [messageId]: priority },
    })),
  
  getMessagePriority: (messageId) => get().messagePriorities[messageId],
  
  setPriorityLoading: (messageId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        priorities: { ...state.loading.priorities, [messageId]: loading },
      },
    })),
  
  setPriorityError: (messageId, error) =>
    set((state) => ({
      errors: { ...state.errors, [`priority_${messageId}`]: error },
    })),

  // Search actions
  setSearchResults: (query, results) =>
    set((state) => ({
      searchResults: { ...state.searchResults, [query]: results },
    })),
  
  getSearchResults: (query) => get().searchResults[query] || [],
  
  setSearchLoading: (query, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        search: { ...state.loading.search, [query]: loading },
      },
    })),
  
  setSearchError: (query, error) =>
    set((state) => ({
      errors: { ...state.errors, [`search_${query}`]: error },
    })),

  // Decision actions
  setDecision: (messageId, decision) =>
    set((state) => ({
      decisions: { ...state.decisions, [messageId]: decision },
    })),
  
  getDecision: (messageId) => get().decisions[messageId],
  
  setDecisionLoading: (messageId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        decisions: { ...state.loading.decisions, [messageId]: loading },
      },
    })),
  
  setDecisionError: (messageId, error) =>
    set((state) => ({
      errors: { ...state.errors, [`decision_${messageId}`]: error },
    })),

  // Proactive suggestions actions
  setProactiveSuggestions: (threadId, suggestions) =>
    set((state) => ({
      proactiveSuggestions: { ...state.proactiveSuggestions, [threadId]: suggestions },
    })),
  
  getProactiveSuggestions: (threadId) => get().proactiveSuggestions[threadId] || [],
  
  addProactiveSuggestion: (threadId, suggestion) =>
    set((state) => ({
      proactiveSuggestions: {
        ...state.proactiveSuggestions,
        [threadId]: [...(state.proactiveSuggestions[threadId] || []), suggestion],
      },
    })),
  
  removeProactiveSuggestion: (threadId, suggestionId) =>
    set((state) => {
      const currentSuggestions = state.proactiveSuggestions[threadId] || [];
      const filteredSuggestions = currentSuggestions.filter((s) => s.id !== suggestionId);
      return {
        proactiveSuggestions: { ...state.proactiveSuggestions, [threadId]: filteredSuggestions },
      };
    }),
  
  setSuggestionsLoading: (threadId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        suggestions: { ...state.loading.suggestions, [threadId]: loading },
      },
    })),
  
  setSuggestionsError: (threadId, error) =>
    set((state) => ({
      errors: { ...state.errors, [`suggestions_${threadId}`]: error },
    })),

  // Utility actions
  clearError: (key) =>
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[key];
      return { errors: newErrors };
    }),
  
  clearAllErrors: () => set({ errors: {} }),
  
  clearCache: () =>
    set({
      threadSummaries: {},
      actionItems: {},
      messagePriorities: {},
      searchResults: {},
      decisions: {},
      proactiveSuggestions: {},
      loading: {
        summaries: {},
        actionItems: {},
        priorities: {},
        search: {},
        decisions: {},
        suggestions: {},
      },
      errors: {},
    }),
}));
