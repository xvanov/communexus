// offline.ts - Enhanced offline support with SQLite, sync, and conflict resolution
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-async-storage/async-storage';
import { Message, Thread, User } from '../types';

// Database schema and types
interface OfflineMessage {
  id?: number;
  messageId: string;
  threadId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  lastRetryAt?: number;
  createdAt: number;
}

interface OfflineThread {
  id?: number;
  threadId: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount: number;
  updatedAt: number;
}

interface OfflineUser {
  id?: number;
  userId: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  isOnline: boolean;
  lastSeenAt?: number;
  updatedAt: number;
}

interface SyncStatus {
  id?: number;
  entityType: 'message' | 'thread' | 'user';
  entityId: string;
  lastSyncAt: number;
  syncVersion: number;
  conflictResolution: 'local' | 'remote' | 'merge';
}

interface ConflictResolution {
  entityType: 'message' | 'thread' | 'user';
  entityId: string;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge';
  resolvedAt: number;
}

const DB_NAME = 'communexus_offline.db';

class OfflineService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private retryQueue: OfflineMessage[] = [];
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000; // Start with 1 second
  private maxRetryDelayMs: number = 30000; // Max 30 seconds

  constructor() {
    this.initDatabase();
    this.setupNetworkListener();
  }

  private initDatabase(): void {
    this.db = SQLite.openDatabase(DB_NAME);

    this.db.transaction(tx => {
      // Messages table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageId TEXT UNIQUE,
          threadId TEXT,
          senderId TEXT,
          text TEXT,
          timestamp INTEGER,
          status TEXT DEFAULT 'pending',
          retryCount INTEGER DEFAULT 0,
          lastRetryAt INTEGER,
          createdAt INTEGER
        )
      `);

      // Threads table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_threads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          threadId TEXT UNIQUE,
          name TEXT,
          participants TEXT,
          lastMessage TEXT,
          lastMessageAt INTEGER,
          unreadCount INTEGER DEFAULT 0,
          updatedAt INTEGER
        )
      `);

      // Users table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT UNIQUE,
          email TEXT,
          displayName TEXT,
          photoUrl TEXT,
          isOnline INTEGER DEFAULT 0,
          lastSeenAt INTEGER,
          updatedAt INTEGER
        )
      `);

      // Sync status table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entityType TEXT,
          entityId TEXT,
          lastSyncAt INTEGER,
          syncVersion INTEGER DEFAULT 1,
          conflictResolution TEXT DEFAULT 'local',
          UNIQUE(entityType, entityId)
        )
      `);

      // Conflict resolution table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS conflict_resolutions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entityType TEXT,
          entityId TEXT,
          localData TEXT,
          remoteData TEXT,
          resolution TEXT,
          resolvedAt INTEGER
        )
      `);

      // Create indexes for performance
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_messages_thread ON offline_messages(threadId)'
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_messages_status ON offline_messages(status)'
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_threads_updated ON offline_threads(updatedAt)'
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_users_online ON offline_users(isOnline)'
      );
    });
  }

  private setupNetworkListener(): void {
    // Note: In a real implementation, you'd use @react-native-netinfo/netinfo
    // For now, we'll simulate network status changes
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  private async checkNetworkStatus(): Promise<void> {
    // Simulate network check - in real implementation, use NetInfo
    const wasOnline = this.isOnline;
    this.isOnline = Math.random() > 0.1; // 90% chance of being online

    if (!wasOnline && this.isOnline) {
      console.log('Network reconnected, starting sync...');
      await this.syncPendingData();
    }
  }

  // Message operations
  async queueMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO offline_messages 
           (messageId, threadId, senderId, text, timestamp, status, createdAt) 
           VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
          [
            message.id,
            message.threadId,
            message.senderId,
            message.text,
            message.timestamp.getTime(),
            Date.now(),
          ],
          () => {
            console.log(`Message ${message.id} queued for offline delivery`);
            resolve();
          },
          (_, error) => {
            console.error('Error queuing message:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getPendingMessages(threadId?: string): Promise<OfflineMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const query = threadId
        ? 'SELECT * FROM offline_messages WHERE status = "pending" AND threadId = ? ORDER BY createdAt ASC'
        : 'SELECT * FROM offline_messages WHERE status = "pending" ORDER BY createdAt ASC';

      const params = threadId ? [threadId] : [];

      this.db!.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const messages: OfflineMessage[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              messages.push(result.rows.item(i) as OfflineMessage);
            }
            resolve(messages);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async markMessageSent(messageId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'UPDATE offline_messages SET status = "sent" WHERE messageId = ?',
          [messageId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async markMessageFailed(messageId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `UPDATE offline_messages 
           SET status = "failed", retryCount = retryCount + 1, lastRetryAt = ? 
           WHERE messageId = ?`,
          [Date.now(), messageId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Thread operations
  async saveThread(thread: Thread): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO offline_threads 
           (threadId, name, participants, lastMessage, lastMessageAt, unreadCount, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            thread.id,
            thread.name,
            JSON.stringify(thread.participants),
            thread.lastMessage?.text,
            thread.lastMessage?.timestamp.getTime(),
            thread.unreadCount || 0,
            Date.now(),
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getThreads(): Promise<Thread[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM offline_threads ORDER BY updatedAt DESC',
          [],
          (_, result) => {
            const threads: Thread[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              threads.push({
                id: row.threadId,
                name: row.name,
                participants: JSON.parse(row.participants),
                lastMessage: row.lastMessage
                  ? {
                      id: 'offline',
                      text: row.lastMessage,
                      timestamp: new Date(row.lastMessageAt),
                      senderId: 'unknown',
                    }
                  : undefined,
                unreadCount: row.unreadCount,
                createdAt: new Date(row.updatedAt),
                updatedAt: new Date(row.updatedAt),
              });
            }
            resolve(threads);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO offline_users 
           (userId, email, displayName, photoUrl, isOnline, lastSeenAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.email,
            user.displayName,
            user.photoUrl,
            user.isOnline ? 1 : 0,
            user.lastSeenAt?.getTime(),
            Date.now(),
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM offline_users ORDER BY displayName ASC',
          [],
          (_, result) => {
            const users: User[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              users.push({
                id: row.userId,
                email: row.email,
                displayName: row.displayName,
                photoUrl: row.photoUrl,
                isOnline: Boolean(row.isOnline),
                lastSeenAt: row.lastSeenAt
                  ? new Date(row.lastSeenAt)
                  : undefined,
                createdAt: new Date(row.updatedAt),
                updatedAt: new Date(row.updatedAt),
              });
            }
            resolve(users);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Sync operations
  async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline data sync...');

    try {
      // Sync pending messages
      await this.syncPendingMessages();

      // Sync threads
      await this.syncThreads();

      // Sync users
      await this.syncUsers();

      console.log('Offline data sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncPendingMessages(): Promise<void> {
    const pendingMessages = await this.getPendingMessages();

    for (const message of pendingMessages) {
      try {
        // Simulate sending message to server
        const success = await this.sendMessageToServer(message);

        if (success) {
          await this.markMessageSent(message.messageId);
          console.log(`Message ${message.messageId} synced successfully`);
        } else {
          await this.markMessageFailed(message.messageId);
          console.log(`Message ${message.messageId} sync failed`);
        }
      } catch (error) {
        console.error(`Error syncing message ${message.messageId}:`, error);
        await this.markMessageFailed(message.messageId);
      }
    }
  }

  private async sendMessageToServer(message: OfflineMessage): Promise<boolean> {
    // Simulate network request with 90% success rate
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async syncThreads(): Promise<void> {
    // Implementation would sync thread data with server
    console.log('Syncing threads...');
  }

  private async syncUsers(): Promise<void> {
    // Implementation would sync user data with server
    console.log('Syncing users...');
  }

  // Conflict resolution
  async resolveConflict(
    entityType: 'message' | 'thread' | 'user',
    entityId: string,
    localData: any,
    remoteData: any,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO conflict_resolutions 
           (entityType, entityId, localData, remoteData, resolution, resolvedAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            entityType,
            entityId,
            JSON.stringify(localData),
            JSON.stringify(remoteData),
            resolution,
            Date.now(),
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Retry logic with exponential backoff
  async retryFailedMessages(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const failedMessages = await this.getFailedMessages();

    for (const message of failedMessages) {
      if (message.retryCount >= this.maxRetries) {
        console.log(
          `Message ${message.messageId} exceeded max retries, giving up`
        );
        continue;
      }

      const delay = this.calculateRetryDelay(message.retryCount);
      const timeSinceLastRetry = Date.now() - (message.lastRetryAt || 0);

      if (timeSinceLastRetry >= delay) {
        try {
          const success = await this.sendMessageToServer(message);
          if (success) {
            await this.markMessageSent(message.messageId);
          } else {
            await this.markMessageFailed(message.messageId);
          }
        } catch (error) {
          console.error(
            `Retry failed for message ${message.messageId}:`,
            error
          );
          await this.markMessageFailed(message.messageId);
        }
      }
    }
  }

  private async getFailedMessages(): Promise<OfflineMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM offline_messages WHERE status = "failed" ORDER BY lastRetryAt ASC',
          [],
          (_, result) => {
            const messages: OfflineMessage[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              messages.push(result.rows.item(i) as OfflineMessage);
            }
            resolve(messages);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay = this.retryDelayMs * Math.pow(2, retryCount);
    return Math.min(delay, this.maxRetryDelayMs);
  }

  // Utility methods
  async clearOldData(daysOld: number = 30): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'DELETE FROM offline_messages WHERE createdAt < ? AND status = "sent"',
          [cutoffTime],
          () => {
            tx.executeSql(
              'DELETE FROM conflict_resolutions WHERE resolvedAt < ?',
              [cutoffTime],
              () => resolve(),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getOfflineStats(): Promise<{
    pendingMessages: number;
    failedMessages: number;
    totalThreads: number;
    totalUsers: number;
    conflictsResolved: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        let completed = 0;
        const stats = {
          pendingMessages: 0,
          failedMessages: 0,
          totalThreads: 0,
          totalUsers: 0,
          conflictsResolved: 0,
        };

        const checkComplete = () => {
          completed++;
          if (completed === 5) {
            resolve(stats);
          }
        };

        // Count pending messages
        tx.executeSql(
          'SELECT COUNT(*) as count FROM offline_messages WHERE status = "pending"',
          [],
          (_, result) => {
            stats.pendingMessages = result.rows.item(0).count;
            checkComplete();
          },
          () => checkComplete()
        );

        // Count failed messages
        tx.executeSql(
          'SELECT COUNT(*) as count FROM offline_messages WHERE status = "failed"',
          [],
          (_, result) => {
            stats.failedMessages = result.rows.item(0).count;
            checkComplete();
          },
          () => checkComplete()
        );

        // Count threads
        tx.executeSql(
          'SELECT COUNT(*) as count FROM offline_threads',
          [],
          (_, result) => {
            stats.totalThreads = result.rows.item(0).count;
            checkComplete();
          },
          () => checkComplete()
        );

        // Count users
        tx.executeSql(
          'SELECT COUNT(*) as count FROM offline_users',
          [],
          (_, result) => {
            stats.totalUsers = result.rows.item(0).count;
            checkComplete();
          },
          () => checkComplete()
        );

        // Count resolved conflicts
        tx.executeSql(
          'SELECT COUNT(*) as count FROM conflict_resolutions',
          [],
          (_, result) => {
            stats.conflictsResolved = result.rows.item(0).count;
            checkComplete();
          },
          () => checkComplete()
        );
      });
    });
  }

  // Public API
  get isConnected(): boolean {
    return this.isOnline;
  }

  get isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Export types for external use
export type {
  OfflineMessage,
  OfflineThread,
  OfflineUser,
  SyncStatus,
  ConflictResolution,
};
