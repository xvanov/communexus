// useInAppNotifications.ts - Show local notifications for new messages
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useThreads } from './useThreads';
import { scheduleLocalNotification } from '../services/notifications';
import { AppState } from 'react-native';

/**
 * Hook to show local notifications when messages are received
 * Works on simulators without requiring push tokens
 */
export const useInAppNotifications = (currentThreadId?: string) => {
  const { user } = useAuth();
  const { threads } = useThreads();
  const lastMessageTimestamps = useRef<Record<string, number>>({});
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || threads.length === 0) return;

    // Check each thread for new messages (with proper timestamp comparison)
    threads.forEach(thread => {
      // Skip if this is the currently open thread
      if (thread.id === currentThreadId) {
        // Update timestamp but don't notify
        if (thread.lastMessage) {
          lastMessageTimestamps.current[thread.id] =
            thread.lastMessage.timestamp.getTime();
        }
        return;
      }

      // Check if there's a new message with valid content
      if (
        thread.lastMessage &&
        thread.lastMessage.text &&
        thread.lastMessage.text.trim() !== '' &&
        thread.lastMessage.senderId &&
        thread.lastMessage.senderName
      ) {
        const lastTimestamp = lastMessageTimestamps.current[thread.id] || 0;
        const currentTimestamp = thread.lastMessage.timestamp.getTime();

        // New message detected
        if (currentTimestamp > lastTimestamp) {
          lastMessageTimestamps.current[thread.id] = currentTimestamp;

          // Only notify if it's from someone else
          if (thread.lastMessage.senderId !== user.uid) {
            // Show local notification
            scheduleLocalNotification(
              thread.lastMessage.senderName,
              thread.lastMessage.text,
              {
                threadId: thread.id,
                senderId: thread.lastMessage.senderId,
                type: 'new_message',
              }
            ).catch(error => {
              console.error('Failed to show notification:', error);
            });

            console.log(
              `📬 Local notification shown: ${thread.lastMessage.senderName} - ${thread.lastMessage.text}`
            );
          }
        }
      }
    });
  }, [threads, user?.uid, currentThreadId]);
};
