// usePresence.ts - Online/offline tracking
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { updateUserOnlineStatus } from '../services/contacts';

/**
 * Hook to manage user online/offline presence
 * Automatically sets user online when logged in and offline on unmount
 */
export const usePresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    // Set user online when component mounts
    updateUserOnlineStatus(user.uid, true).catch(error => {
      console.error('Failed to set user online:', error);
    });

    // Set user offline when component unmounts or page closes
    return () => {
      updateUserOnlineStatus(user.uid, false).catch(error => {
        console.error('Failed to set user offline:', error);
      });
    };
  }, [user?.uid]);

  return { isOnline: true, lastSeen: null };
};
