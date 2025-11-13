// checklistService.ts - Checklist CRUD service
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  Checklist,
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistFirestore,
  ChecklistItemFirestore,
} from '../types/Checklist';

/**
 * Convert Firestore Checklist to Checklist
 */
const convertFirestoreChecklist = (
  id: string,
  data: ChecklistFirestore
): Checklist => {
  return {
    id,
    threadId: data.threadId,
    title: data.title,
    items: data.items.map(item => convertFirestoreItem(item)),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
  };
};

/**
 * Convert Firestore ChecklistItem to ChecklistItem
 */
const convertFirestoreItem = (item: ChecklistItemFirestore): ChecklistItem => {
  return {
    id: item.id,
    checklistId: item.checklistId,
    title: item.title,
    status: item.status,
    order: item.order,
    completedAt: item.completedAt?.toDate(),
    completedBy: item.completedBy,
    mediaAttachments: item.mediaAttachments,
  };
};

/**
 * Convert Checklist to Firestore format
 */
const convertToFirestore = (
  checklist: Omit<Checklist, 'id'> | Partial<Checklist>
): Omit<ChecklistFirestore, 'id'> => {
  return {
    threadId: checklist.threadId!,
    title: checklist.title!,
    items: checklist.items?.map(item => {
      const firestoreItem: any = {
        id: item.id,
        checklistId: item.checklistId,
        title: item.title,
        status: item.status,
        order: item.order,
      };
      
      // Only include optional fields if they have values (Firestore doesn't allow undefined)
      if (item.completedAt) {
        firestoreItem.completedAt = Timestamp.fromDate(item.completedAt);
      }
      if (item.completedBy !== undefined && item.completedBy !== null) {
        firestoreItem.completedBy = item.completedBy;
      }
      if (item.mediaAttachments !== undefined && item.mediaAttachments !== null) {
        firestoreItem.mediaAttachments = item.mediaAttachments;
      }
      
      return firestoreItem;
    }) || [],
    createdAt: checklist.createdAt
      ? Timestamp.fromDate(checklist.createdAt)
      : serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: checklist.createdBy!,
  };
};

/**
 * Create a new checklist
 */
export const createChecklist = async (
  threadId: string,
  title: string,
  createdBy: string
): Promise<Checklist> => {
  const db = await getDb();
  const col = collection(db, 'checklists');

  try {
    const checklistData = {
      threadId,
      title,
      items: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    };

    const docRef = await addDoc(col, checklistData);

    // Fetch the created document to return
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error('Failed to create checklist');
    }

    return convertFirestoreChecklist(snapshot.id, snapshot.data() as ChecklistFirestore);
  } catch (error) {
    console.error('Failed to create checklist:', error);
    throw new Error('Failed to create checklist. Please try again.');
  }
};

/**
 * Get a single checklist by ID
 */
export const getChecklist = async (checklistId: string): Promise<Checklist | null> => {
  const db = await getDb();
  const checklistRef = doc(db, 'checklists', checklistId);
  const snapshot = await getDoc(checklistRef);

  if (!snapshot.exists()) {
    return null;
  }

  return convertFirestoreChecklist(snapshot.id, snapshot.data() as ChecklistFirestore);
};

/**
 * Update a checklist
 */
export const updateChecklist = async (
  checklistId: string,
  updates: Partial<Checklist>
): Promise<Checklist> => {
  const db = await getDb();
  const checklistRef = doc(db, 'checklists', checklistId);

  try {
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.items !== undefined) {
      // Deduplicate items by ID before saving (prevent duplicates in Firestore)
      const itemsMap = new Map<string, ChecklistItem>();
      updates.items.forEach(item => {
        if (!itemsMap.has(item.id)) {
          itemsMap.set(item.id, item);
        } else {
          console.warn(`Duplicate item ID detected when updating checklist: ${item.id}`);
        }
      });
      const uniqueItems = Array.from(itemsMap.values());
      
      updateData.items = uniqueItems.map(item => {
        const firestoreItem: any = {
          id: item.id,
          checklistId: item.checklistId,
          title: item.title,
          status: item.status,
          order: item.order,
        };
        
        // Only include optional fields if they have values (Firestore doesn't allow undefined)
        if (item.completedAt) {
          firestoreItem.completedAt = Timestamp.fromDate(item.completedAt);
        }
        if (item.completedBy !== undefined && item.completedBy !== null) {
          firestoreItem.completedBy = item.completedBy;
        }
        if (item.mediaAttachments !== undefined && item.mediaAttachments !== null) {
          firestoreItem.mediaAttachments = item.mediaAttachments;
        }
        
        return firestoreItem;
      });
    }

    await updateDoc(checklistRef, updateData);

    // Fetch updated document
    const updated = await getChecklist(checklistId);
    if (!updated) {
      throw new Error('Checklist not found after update');
    }

    return updated;
  } catch (error) {
    console.error('Failed to update checklist:', error);
    throw new Error('Failed to update checklist. Please try again.');
  }
};

/**
 * Create a checklist item
 */
export const createChecklistItem = async (
  checklistId: string,
  item: Omit<ChecklistItem, 'id'>
): Promise<ChecklistItem> => {
  const db = await getDb();
  const checklistRef = doc(db, 'checklists', checklistId);

  try {
    // Get current checklist
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    // Generate item ID
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new item
    const newItem: ChecklistItem = {
      id: itemId,
      checklistId,
      title: item.title,
      status: item.status || 'pending',
      order: item.order ?? checklist.items.length,
      completedAt: item.completedAt,
      completedBy: item.completedBy,
      mediaAttachments: item.mediaAttachments,
    };

    // Add item to checklist
    const updatedItems = [...checklist.items, newItem];
    await updateChecklist(checklistId, { items: updatedItems });

    return newItem;
  } catch (error) {
    console.error('Failed to create checklist item:', error);
    throw new Error('Failed to create checklist item. Please try again.');
  }
};

/**
 * Update a checklist item
 */
export const updateChecklistItem = async (
  checklistId: string,
  itemId: string,
  updates: Partial<ChecklistItem>
): Promise<ChecklistItem> => {
  const db = await getDb();

  try {
    // Get current checklist
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    // Find and update item
    const updatedItems = checklist.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          // Preserve id and checklistId
          id: item.id,
          checklistId: item.checklistId,
        };
      }
      return item;
    });

    // Check if item was found
    const itemIndex = updatedItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Checklist item not found');
    }

    await updateChecklist(checklistId, { items: updatedItems });

    const updatedItem = updatedItems[itemIndex];
    return updatedItem;
  } catch (error) {
    console.error('Failed to update checklist item:', error);
    throw new Error('Failed to update checklist item. Please try again.');
  }
};

/**
 * Mark a checklist item as complete
 */
export const markItemComplete = async (
  checklistId: string,
  itemId: string,
  completedBy?: string
): Promise<ChecklistItem> => {
  return updateChecklistItem(checklistId, itemId, {
    status: 'completed',
    completedAt: new Date(),
    completedBy,
  });
};

/**
 * Get all checklists for a thread
 */
export const getChecklistsByThread = async (
  threadId: string
): Promise<Checklist[]> => {
  const db = await getDb();
  const col = collection(db, 'checklists');
  const q = query(
    col,
    where('threadId', '==', threadId),
    orderBy('createdAt', 'desc')
  );

  try {
    const snapshot = await getDocs(q);
    const checklists: Checklist[] = [];

    snapshot.forEach(doc => {
      checklists.push(
        convertFirestoreChecklist(doc.id, doc.data() as ChecklistFirestore)
      );
    });

    return checklists;
  } catch (error) {
    console.error('Failed to get checklists by thread:', error);
    throw new Error('Failed to load checklists. Please try again.');
  }
};

/**
 * Calculate progress for a checklist
 */
export const calculateProgress = async (
  checklistId: string
): Promise<{ total: number; completed: number; percentage: number }> => {
  try {
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const total = checklist.items.length;
    const completed = checklist.items.filter(
      item => item.status === 'completed'
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  } catch (error) {
    console.error('Failed to calculate progress:', error);
    throw new Error('Failed to calculate progress. Please try again.');
  }
};

