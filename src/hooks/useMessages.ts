// useMessages.ts - Subscribe to messages with real-time updates
import { useState, useEffect } from 'react';
import { Message } from '../types/Message';
import { subscribeToMessages, markMessagesAsRead } from '../services/messaging';
import { useAuth } from './useAuth';

export const useMessages = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Message loading timeout - stopping loading state');
        setLoading(false);
        setError('Timeout loading messages');
      }
    }, 10000); // 10 second timeout

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToMessages(threadId, updatedMessages => {
          clearTimeout(timeoutId);
          setMessages(updatedMessages);
          setLoading(false);
          setError(null);
        });
      } catch (error) {
        console.error('Failed to setup message subscription:', error);
        setError('Failed to load messages');
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [threadId]);

  // Mark messages as read when user views them
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.readBy.includes(user.uid))
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(threadId, user.uid, unreadMessageIds).catch(
          error => {
            console.error('Failed to mark messages as read:', error);
          }
        );
      }
    }
  }, [threadId, user?.uid, messages]);

  return { messages, loading, error };
};
