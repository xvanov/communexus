// useOfflineQueue.ts - Enhanced offline message handling with sync and conflict resolution
import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineService, OfflineMessage } from '../services/offline';
import { syncService, SyncResult } from '../services/sync';
import { Message } from '../types';

export interface OfflineQueueState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingMessages: OfflineMessage[];
  failedMessages: OfflineMessage[];
  syncStats: {
    pendingMessages: number;
    failedMessages: number;
    totalThreads: number;
    totalUsers: number;
    conflictsResolved: number;
    lastSyncTime: Date | null;
    nextSyncTime: Date;
  };
  syncResult: SyncResult | null;
  error: string | null;
}

export interface OfflineQueueActions {
  addMessage: (message: Message) => Promise<void>;
  retryMessage: (messageId: string) => Promise<boolean>;
  retryAllFailed: () => Promise<void>;
  triggerSync: () => Promise<void>;
  clearError: () => void;
  getOfflineStats: () => Promise<void>;
}

export const useOfflineQueue = (): OfflineQueueState & OfflineQueueActions => {
  const [state, setState] = useState<OfflineQueueState>({
    isOnline: offlineService.isConnected,
    isSyncing: false,
    pendingMessages: [],
    failedMessages: [],
    syncStats: {
      pendingMessages: 0,
      failedMessages: 0,
      totalThreads: 0,
      totalUsers: 0,
      conflictsResolved: 0,
      lastSyncTime: null,
      nextSyncTime: new Date(),
    },
    syncResult: null,
    error: null,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize offline service and load initial data
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await loadOfflineData();
        await getOfflineStats();
      } catch (error) {
        console.error('Error initializing offline service:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to initialize offline service',
        }));
      }
    };

    initializeOffline();

    // Set up periodic stats updates
    const updateStats = () => {
      getOfflineStats();
      statsTimeoutRef.current = setTimeout(updateStats, 10000); // Update every 10 seconds
    };
    updateStats();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, []);

  // Load offline data
  const loadOfflineData = useCallback(async () => {
    try {
      const [pendingMessages, failedMessages] = await Promise.all([
        offlineService.getPendingMessages(),
        offlineService.getFailedMessages(),
      ]);

      setState(prev => ({
        ...prev,
        pendingMessages,
        failedMessages,
      }));
    } catch (error) {
      console.error('Error loading offline data:', error);
      throw error;
    }
  }, []);

  // Get offline statistics
  const getOfflineStats = useCallback(async () => {
    try {
      const stats = await offlineService.getOfflineStats();
      const syncStatus = syncService.getSyncStatus();

      setState(prev => ({
        ...prev,
        syncStats: {
          ...stats,
          lastSyncTime: syncStatus.lastSyncTime,
          nextSyncTime: syncStatus.nextSyncTime,
        },
      }));
    } catch (error) {
      console.error('Error getting offline stats:', error);
    }
  }, []);

  // Add message to offline queue
  const addMessage = useCallback(
    async (message: Message) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        await offlineService.queueMessage(message);

        // Reload offline data to reflect the new message
        await loadOfflineData();
        await getOfflineStats();

        console.log(`Message ${message.id} added to offline queue`);
      } catch (error) {
        console.error('Error adding message to offline queue:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to add message to offline queue',
        }));
        throw error;
      }
    },
    [loadOfflineData, getOfflineStats]
  );

  // Retry a specific failed message
  const retryMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const success = await syncService.syncEntity('message', messageId);

        if (success) {
          await loadOfflineData();
          await getOfflineStats();
          console.log(`Message ${messageId} retry successful`);
        } else {
          console.log(`Message ${messageId} retry failed`);
        }

        return success;
      } catch (error) {
        console.error(`Error retrying message ${messageId}:`, error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to retry message',
        }));
        return false;
      }
    },
    [loadOfflineData, getOfflineStats]
  );

  // Retry all failed messages
  const retryAllFailed = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isSyncing: true }));

      await offlineService.retryFailedMessages();

      // Reload data after retry attempts
      await loadOfflineData();
      await getOfflineStats();

      console.log('Retry all failed messages completed');
    } catch (error) {
      console.error('Error retrying all failed messages:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retry failed messages',
      }));
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [loadOfflineData, getOfflineStats]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isSyncing: true }));

      const syncResult = await syncService.triggerSync();

      setState(prev => ({
        ...prev,
        syncResult,
        isSyncing: false,
      }));

      // Reload data after sync
      await loadOfflineData();
      await getOfflineStats();

      console.log('Manual sync completed:', syncResult);
    } catch (error) {
      console.error('Error during manual sync:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed',
        isSyncing: false,
      }));
    }
  }, [loadOfflineData, getOfflineStats]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && !state.isSyncing) {
      // Delay sync slightly to avoid overwhelming the server
      syncTimeoutRef.current = setTimeout(() => {
        triggerSync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }, 2000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state.isOnline, state.isSyncing, triggerSync]);

  // Monitor network status changes
  useEffect(() => {
    const checkNetworkStatus = () => {
      const isOnline = offlineService.isConnected;
      setState(prev => ({ ...prev, isOnline }));
    };

    // Check network status every 5 seconds
    const interval = setInterval(checkNetworkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Monitor sync status
  useEffect(() => {
    const checkSyncStatus = () => {
      const isSyncing = syncService.getSyncStatus().inProgress;
      setState(prev => ({ ...prev, isSyncing }));
    };

    // Check sync status every second
    const interval = setInterval(checkSyncStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    addMessage,
    retryMessage,
    retryAllFailed,
    triggerSync,
    clearError,
    getOfflineStats,
  };
};
