// AIFeatures.ts - AI feature data models and TypeScript interfaces

// Namespace for AI features (for compatibility with cloud functions)
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AIFeatures {
  export type PriorityLevel = 'low' | 'medium' | 'high';

  export interface ThreadSummary {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    generatedAt: string;
  }

  export interface ActionItem {
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

  export interface ProactiveSuggestion {
    type: 'reminder' | 'followup' | 'action' | 'insight';
    message: string;
    priority: PriorityLevel;
    context: string;
    suggestedAction?: string;
  }
}

// Named exports for convenience
export type PriorityLevel = AIFeatures.PriorityLevel;
export type ThreadSummary = AIFeatures.ThreadSummary;
export type AIActionItem = AIFeatures.ActionItem;
export type Priority = AIFeatures.Priority;
export type SearchResult = AIFeatures.SearchResult;
export type AIDecision = AIFeatures.Decision;
export type ProactiveSuggestion = AIFeatures.ProactiveSuggestion;

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
