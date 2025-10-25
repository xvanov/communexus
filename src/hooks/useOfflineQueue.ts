// useOfflineQueue.ts - Hook for managing offline message queue
import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offline';

interface OfflineStats {
  pendingMessages: number;
  failedMessages: number;
  totalThreads: number;
  totalUsers: number;
  conflictsResolved: number;
}

export const useOfflineQueue = () => {
  const [stats, setStats] = useState<OfflineStats>({
    pendingMessages: 0,
    failedMessages: 0,
    totalThreads: 0,
    totalUsers: 0,
    conflictsResolved: 0,
  });
  const [loading, setLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      const newStats = await offlineService.getOfflineStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching offline stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();

    // Refresh every 10 seconds
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const retryFailedMessages = useCallback(async () => {
    await offlineService.retryFailedMessages();
    await refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
    retryFailedMessages,
    isOnline: offlineService.isConnected,
    isSyncing: offlineService.isSyncing,
  };
};
