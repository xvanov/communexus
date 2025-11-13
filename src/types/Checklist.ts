// Checklist.ts - Checklist data model and TypeScript interfaces
import { Timestamp } from 'firebase/firestore';

/**
 * ChecklistItem status enum
 * Represents the completion status of a checklist item
 */
export type ChecklistItemStatus = 'pending' | 'in-progress' | 'completed';

/**
 * ChecklistItem data model
 * 
 * Represents a single item within a checklist.
 * Items are stored as an embedded array within the Checklist document for MVP simplicity.
 */
export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  status: ChecklistItemStatus;
  order: number;
  completedAt?: Date;
  completedBy?: string;
  mediaAttachments?: string[];
}

/**
 * Checklist data model
 * 
 * Represents a checklist linked to a thread.
 * Checklists enable users to track project tasks in a structured way.
 */
export interface Checklist {
  id: string;
  threadId: string;
  title: string;
  items: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  progress?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

/**
 * Firestore Checklist document structure
 * Used for Firestore operations where Timestamps are used instead of Dates
 */
export interface ChecklistFirestore {
  id: string;
  threadId: string;
  title: string;
  items: ChecklistItemFirestore[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Firestore ChecklistItem structure
 * Used for Firestore operations where Timestamps are used instead of Dates
 */
export interface ChecklistItemFirestore {
  id: string;
  checklistId: string;
  title: string;
  status: ChecklistItemStatus;
  order: number;
  completedAt?: Timestamp;
  completedBy?: string;
  mediaAttachments?: string[];
}

