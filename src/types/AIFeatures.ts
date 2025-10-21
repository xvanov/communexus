// AIFeatures.ts - AI feature data models and TypeScript interfaces
// TODO: Define AI feature interfaces for summaries, decisions, and action items
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
