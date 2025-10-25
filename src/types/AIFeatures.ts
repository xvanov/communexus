// AIFeatures.ts - AI feature data models and TypeScript interfaces

export type PriorityLevel = 'low' | 'medium' | 'high';

export interface ThreadSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  generatedAt: string;
}

export interface AIActionItem {
  id: string;
  threadId: string;
  messageId: string;
  task: string;
  text?: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: PriorityLevel;
  status: 'pending' | 'completed';
  createdAt: Date;
}

export interface Priority {
  level: PriorityLevel;
  confidence: number;
  reason: string;
}

export interface SearchResult {
  messageId: string;
  threadId: string;
  text: string;
  snippet?: string;
  sender: string;
  timestamp: Date;
  relevance: number;
}

export interface AIDecision {
  id: string;
  threadId: string;
  messageId: string;
  decision: string;
  context: string;
  participants: string[];
  decidedAt: Date;
  markedBy: string;
  createdAt: Date;
}

export interface ProactiveSuggestion {
  type: 'reminder' | 'followup' | 'action' | 'insight';
  message: string;
  priority: PriorityLevel;
  context: string;
  suggestedAction?: string;
}

// Grouped exports for convenience
export const AIFeatures = {
  PriorityLevel: {} as PriorityLevel,
  ThreadSummary: {} as ThreadSummary,
  ActionItem: {} as AIActionItem,
  Priority: {} as Priority,
  SearchResult: {} as SearchResult,
  Decision: {} as AIDecision,
  ProactiveSuggestion: {} as ProactiveSuggestion,
};

// Legacy exports for backward compatibility
export interface AISummary {
  id: string;
  threadId: string;
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  unresolvedIssues: string[];
  nextSteps: string[];
  generatedAt: Date;
  messageCount: number;
  lastMessageId: string;
}

export interface Decision {
  id: string;
  threadId: string;
  messageId: string;
  decision: string;
  context: string;
  participants: string[];
  decidedAt: Date;
  markedBy: string;
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  threadId: string;
  messageId: string;
  task: string;
  assignedTo?: string;
  dueDate?: Date;
  status: 'pending' | 'completed';
  createdAt: Date;
}
