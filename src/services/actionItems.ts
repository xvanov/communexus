// actionItems.ts - Firestore service for action items persistence
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { AIFeatures } from '../types/AIFeatures';

const COLLECTION_NAME = 'actionItems';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Safely convert date to Firestore Timestamp
const toTimestamp = (
  date: Date | string | undefined | null
): Timestamp | null => {
  if (!date) return null;

  try {
    if (date instanceof Date) {
      // Validate date is not invalid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date, using current time');
        return Timestamp.now();
      }
      return Timestamp.fromDate(date);
    }

    // Try to parse string date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date string, using current time:', date);
      return Timestamp.now();
    }
    return Timestamp.fromDate(parsedDate);
  } catch (error) {
    console.warn('Error converting date to timestamp:', error, date);
    return Timestamp.now();
  }
};

// Convert ActionItem to Firestore format
const toFirestore = (actionItem: AIFeatures.ActionItem): any => {
  const data: any = {
    id: actionItem.id,
    threadId: actionItem.threadId,
    task: actionItem.task,
    priority: actionItem.priority,
    status: actionItem.status,
    createdAt: toTimestamp(actionItem.createdAt) || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (actionItem.messageId) data.messageId = actionItem.messageId;
  if (actionItem.text) data.text = actionItem.text;
  if (actionItem.assignedTo) data.assignedTo = actionItem.assignedTo;

  const dueDateTimestamp = toTimestamp(actionItem.dueDate);
  if (dueDateTimestamp) data.dueDate = dueDateTimestamp;

  const completedAtTimestamp = toTimestamp(actionItem.completedAt);
  if (completedAtTimestamp) data.completedAt = completedAtTimestamp;

  if (actionItem.completedBy) data.completedBy = actionItem.completedBy;

  const updatedAtTimestamp = actionItem.updatedAt
    ? toTimestamp(actionItem.updatedAt)
    : null;
  if (updatedAtTimestamp) data.updatedAt = updatedAtTimestamp;

  return data;
};

// Convert Firestore document to ActionItem
const fromFirestore = (doc: any): AIFeatures.ActionItem => {
  const data = doc.data();
  const result: AIFeatures.ActionItem = {
    id: data.id || doc.id,
    threadId: data.threadId,
    task: data.task,
    priority: data.priority || 'medium',
    status: data.status || 'pending',
    createdAt: convertTimestamp(data.createdAt),
  };

  if (data.messageId) result.messageId = data.messageId;
  if (data.text) result.text = data.text;
  if (data.assignedTo) result.assignedTo = data.assignedTo;
  if (data.dueDate) result.dueDate = convertTimestamp(data.dueDate);
  if (data.completedAt) result.completedAt = convertTimestamp(data.completedAt);
  if (data.completedBy) result.completedBy = data.completedBy;
  if (data.updatedAt) result.updatedAt = convertTimestamp(data.updatedAt);

  return result;
};

/**
 * Save or update an action item in Firestore
 */
export const saveActionItem = async (
  actionItem: AIFeatures.ActionItem
): Promise<void> => {
  try {
    const db = await getDb();
    const actionItemsRef = collection(db, COLLECTION_NAME);
    const actionItemRef = doc(actionItemsRef, actionItem.id);

    const firestoreData = toFirestore(actionItem);
    await setDoc(actionItemRef, firestoreData, { merge: true });

    console.log('✅ Action item saved:', actionItem.id);
  } catch (error) {
    console.error('❌ Error saving action item:', error);
    throw error;
  }
};

/**
 * Save multiple action items to Firestore
 */
export const saveActionItems = async (
  actionItems: AIFeatures.ActionItem[]
): Promise<void> => {
  try {
    const promises = actionItems.map(item => saveActionItem(item));
    await Promise.all(promises);
    console.log(`✅ Saved ${actionItems.length} action items`);
  } catch (error) {
    console.error('❌ Error saving action items:', error);
    throw error;
  }
};

/**
 * Update action item status (complete/incomplete)
 */
export const updateActionItemStatus = async (
  actionItemId: string,
  status: 'pending' | 'completed',
  userId?: string
): Promise<void> => {
  try {
    const db = await getDb();
    const actionItemsRef = collection(db, COLLECTION_NAME);
    const actionItemRef = doc(actionItemsRef, actionItemId);

    const updates: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (status === 'completed') {
      updates.completedAt = Timestamp.now();
      if (userId) {
        updates.completedBy = userId;
      }
      // If no userId provided, Firestore will not set completedBy
      // This is okay - it can be set later if needed
    } else {
      // If marking as pending, clear completion data
      updates.completedAt = null;
      updates.completedBy = null;
    }

    await updateDoc(actionItemRef, updates);
    console.log(`✅ Action item ${actionItemId} updated to ${status}`);
  } catch (error) {
    console.error('❌ Error updating action item status:', error);
    throw error;
  }
};

/**
 * Get all action items for a thread
 */
export const getActionItemsForThread = async (
  threadId: string
): Promise<AIFeatures.ActionItem[]> => {
  try {
    const db = await getDb();
    const actionItemsRef = collection(db, COLLECTION_NAME);
    const q = query(
      actionItemsRef,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const actionItems = snapshot.docs.map(doc => fromFirestore(doc));

    console.log(
      `✅ Loaded ${actionItems.length} action items for thread ${threadId}`
    );
    return actionItems;
  } catch (error) {
    console.error('❌ Error loading action items:', error);
    throw error;
  }
};

/**
 * Get action item by ID
 */
export const getActionItem = async (
  actionItemId: string
): Promise<AIFeatures.ActionItem | null> => {
  try {
    const db = await getDb();
    const actionItemsRef = collection(db, COLLECTION_NAME);
    const actionItemRef = doc(actionItemsRef, actionItemId);
    const snapshot = await getDoc(actionItemRef);

    if (!snapshot.exists()) {
      return null;
    }

    return fromFirestore(snapshot);
  } catch (error: any) {
    // If permission denied, the document might not exist or user doesn't have access
    // Return null to indicate document not found
    if (error?.code === 'permission-denied') {
      return null;
    }
    console.error('❌ Error loading action item:', error);
    throw error;
  }
};

/**
 * Delete an action item
 */
export const deleteActionItem = async (actionItemId: string): Promise<void> => {
  try {
    const db = await getDb();
    const actionItemsRef = collection(db, COLLECTION_NAME);
    const actionItemRef = doc(actionItemsRef, actionItemId);
    await deleteDoc(actionItemRef);
    console.log(`✅ Action item ${actionItemId} deleted`);
  } catch (error) {
    console.error('❌ Error deleting action item:', error);
    throw error;
  }
};

/**
 * Search action items by task text
 */
export const searchActionItems = async (
  threadId: string,
  searchQuery: string
): Promise<AIFeatures.ActionItem[]> => {
  try {
    // Get all action items for thread and filter client-side
    // Note: Firestore doesn't support full-text search natively
    // For better search, consider using Algolia or similar
    const allItems = await getActionItemsForThread(threadId);
    const query = searchQuery.toLowerCase().trim();

    const filtered = allItems.filter(item => {
      const taskMatch = item.task.toLowerCase().includes(query);
      const textMatch = item.text?.toLowerCase().includes(query);
      const assignedMatch = item.assignedTo?.toLowerCase().includes(query);

      return taskMatch || textMatch || assignedMatch;
    });

    return filtered;
  } catch (error) {
    console.error('❌ Error searching action items:', error);
    throw error;
  }
};

/**
 * Filter action items by status
 */
export const filterActionItemsByStatus = (
  actionItems: AIFeatures.ActionItem[],
  status?: 'pending' | 'completed' | 'all'
): AIFeatures.ActionItem[] => {
  if (!status || status === 'all') {
    return actionItems;
  }

  return actionItems.filter(item => item.status === status);
};
