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

    const unsubscribe = subscribeToMessages(threadId, updatedMessages => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    return () => {
      unsubscribe();
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
          (error) => {
            // eslint-disable-next-line no-console
            console.error('Failed to mark messages as read:', error);
          }
        );
      }
    }
  }, [threadId, user?.uid, messages]);

  return { messages, loading, error };
};
