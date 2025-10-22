// useThreads.ts - Subscribe to threads with unread counts
import { useState, useEffect } from 'react';
import { Thread } from '../types/Thread';
import { subscribeToUserThreads } from '../services/threads';
import { useAuth } from './useAuth';
import { getDb } from '../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  or,
} from 'firebase/firestore';

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

    setLoading(true);
    setError(null);

    // Create a custom subscription that looks for threads where the user's UID OR email is in participants
    const db = getDb();
    const col = collection(db, 'threads');

    // Query for threads where user's UID is in participants
    const q1 = query(
      col,
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    // Query for threads where user's email is in participants (for test users)
    const q2 = user.email
      ? query(
          col,
          where('participants', 'array-contains', user.email),
          orderBy('updatedAt', 'desc')
        )
      : null;

    // Subscribe to both queries and merge results
    const unsubscribe1 = onSnapshot(
      q1,
      snapshot => {
        try {
          const threadsFromUid: Thread[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            threadsFromUid.push({
              id: doc.id,
              participants: data.participants || [],
              participantDetails: data.participantDetails || [],
              isGroup: data.isGroup || false,
              groupName: data.groupName,
              groupPhotoUrl: data.groupPhotoUrl,
              lastMessage: data.lastMessage
                ? {
                    ...data.lastMessage,
                    timestamp:
                      data.lastMessage.timestamp?.toDate() || new Date(),
                  }
                : {
                    text: '',
                    senderId: '',
                    senderName: '',
                    timestamp: new Date(),
                  },
              unreadCount: data.unreadCount || {},
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          });

          // Merge with existing threads and remove duplicates
          setThreads(prevThreads => {
            const allThreads = [...prevThreads, ...threadsFromUid];
            const uniqueThreads = allThreads.filter(
              (thread, index, self) =>
                index === self.findIndex(t => t.id === thread.id)
            );
            return uniqueThreads.sort(
              (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
            );
          });
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing threads from UID:', err);
          setError('Failed to load threads');
          setLoading(false);
        }
      },
      error => {
        console.error('Error subscribing to threads:', error);
        setError('Failed to load threads');
        setLoading(false);
      }
    );

    const unsubscribe2 = q2
      ? onSnapshot(
          q2,
          snapshot => {
            try {
              const threadsFromEmail: Thread[] = [];
              snapshot.forEach(doc => {
                const data = doc.data();
                threadsFromEmail.push({
                  id: doc.id,
                  participants: data.participants || [],
                  participantDetails: data.participantDetails || [],
                  isGroup: data.isGroup || false,
                  groupName: data.groupName,
                  groupPhotoUrl: data.groupPhotoUrl,
                  lastMessage: data.lastMessage
                    ? {
                        ...data.lastMessage,
                        timestamp:
                          data.lastMessage.timestamp?.toDate() || new Date(),
                      }
                    : {
                        text: '',
                        senderId: '',
                        senderName: '',
                        timestamp: new Date(),
                      },
                  unreadCount: data.unreadCount || {},
                  createdAt: data.createdAt?.toDate() || new Date(),
                  updatedAt: data.updatedAt?.toDate() || new Date(),
                });
              });

              // Merge with existing threads and remove duplicates
              setThreads(prevThreads => {
                const allThreads = [...prevThreads, ...threadsFromEmail];
                const uniqueThreads = allThreads.filter(
                  (thread, index, self) =>
                    index === self.findIndex(t => t.id === thread.id)
                );
                return uniqueThreads.sort(
                  (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
                );
              });
              setLoading(false);
              setError(null);
            } catch (err) {
              console.error('Error processing threads from email:', err);
              setError('Failed to load threads');
              setLoading(false);
            }
          },
          error => {
            console.error('Error subscribing to threads by email:', error);
            setError('Failed to load threads');
            setLoading(false);
          }
        )
      : null;

    return () => {
      unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };
  }, [user?.uid, user?.email]);

  return { threads, loading, error };
};
