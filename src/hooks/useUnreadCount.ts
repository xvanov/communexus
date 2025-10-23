// useUnreadCount.ts - Hook to manage unread message counts and badge updates
import { useEffect } from 'react';
import { Thread } from '../types/Thread';
import { useAuth } from './useAuth';
import {
  calculateTotalUnreadCount,
  updateBadgeFromUnreadCount,
} from '../services/notifications';

/**
 * Hook to automatically update app badge based on unread message counts
 * @param threads - Array of threads with unread counts
 */
export const useUnreadCount = (threads: Thread[]) => {
  const { user } = useAuth();

  useEffect(() => {
    const updateBadge = async () => {
      if (!user?.uid) return;

      try {
        const unreadCount = calculateTotalUnreadCount(threads, user.uid);
        await updateBadgeFromUnreadCount(unreadCount);
      } catch (error) {
        console.error('Error updating badge count:', error);
      }
    };

    updateBadge();
  }, [threads, user]);
};
