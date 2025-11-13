// useChecklists.ts - Subscribe to checklists for a thread
import { useState, useEffect } from 'react';
import { Checklist } from '../types/Checklist';
import { getChecklistsByThread } from '../services/checklistService';

export const useChecklists = (threadId: string) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadChecklists = async () => {
      try {
        const loadedChecklists = await getChecklistsByThread(threadId);
        setChecklists(loadedChecklists);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load checklists:', err);
        setError('Failed to load checklists');
        setLoading(false);
      }
    };

    loadChecklists();

    // For MVP, we'll poll every 5 seconds for updates
    // Future: Use Firestore real-time listeners
    const intervalId = setInterval(loadChecklists, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [threadId]);

  return { checklists, loading, error };
};

