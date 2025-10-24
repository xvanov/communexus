// useThreads.ts - Subscribe to threads with unread counts
import { useState, useEffect } from 'react';
import { Thread } from '../types/Thread';
import { subscribeToUserThreads } from '../services/threads';
import { useAuth } from './useAuth';
// Removed unused imports

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setThreads([]);
      setLoading(false);
      return;
    }

    console.log('🔄 Setting up thread listener for user:', user.uid);
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | null = null;

    // Use the existing subscribeToUserThreads function which is simpler and more reliable
    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToUserThreads(user.uid, updatedThreads => {
          console.log('📱 Threads updated:', updatedThreads.length, 'threads');
          updatedThreads.forEach(thread => {
            console.log(`Thread ${thread.id}:`, {
              lastMessage: thread.lastMessage
                ? `${thread.lastMessage.senderName}: ${thread.lastMessage.text?.substring(0, 20)}...`
                : 'No message',
              updatedAt: thread.updatedAt.toLocaleTimeString(),
            });
          });

          setThreads(updatedThreads);
          setLoading(false);
          setError(null);
        });
      } catch (error) {
        console.error('Failed to setup thread subscription:', error);
        setError('Failed to load threads');
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      console.log('🔄 Cleaning up thread listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  return { threads, loading, error };
};
