// sync.ts - Data synchronization with conflict resolution
import { offlineService, OfflineMessage, OfflineThread, OfflineUser } from './offline';
import { Message, Thread, User } from '../types';

export interface SyncResult {
  success: boolean;
  syncedMessages: number;
  syncedThreads: number;
  syncedUsers: number;
  conflictsResolved: number;
  errors: string[];
}

export interface ConflictResolution {
  entityType: 'message' | 'thread' | 'user';
  entityId: string;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge';
  resolvedAt: Date;
}

class SyncService {
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private syncInterval: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.startPeriodicSync();
  }

  // Main sync method
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return {
        success: false,
        syncedMessages: 0,
        syncedThreads: 0,
        syncedUsers: 0,
        conflictsResolved: 0,
        errors: ['Sync already in progress']
      };
    }

    this.syncInProgress = true;
    this.lastSyncTime = Date.now();

    const result: SyncResult = {
      success: true,
      syncedMessages: 0,
      syncedThreads: 0,
      syncedUsers: 0,
      conflictsResolved: 0,
      errors: []
    };

    try {
      console.log('Starting comprehensive sync...');

      // Sync messages
      const messageResult = await this.syncMessages();
      result.syncedMessages = messageResult.synced;
      result.errors.push(...messageResult.errors);

      // Sync threads
      const threadResult = await this.syncThreads();
      result.syncedThreads = threadResult.synced;
      result.errors.push(...threadResult.errors);

      // Sync users
      const userResult = await this.syncUsers();
      result.syncedUsers = userResult.synced;
      result.errors.push(...userResult.errors);

      // Resolve conflicts
      const conflictResult = await this.resolveConflicts();
      result.conflictsResolved = conflictResult.resolved;
      result.errors.push(...conflictResult.errors);

      result.success = result.errors.length === 0;
      console.log('Sync completed:', result);

    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Sync pending messages
  private async syncMessages(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const pendingMessages = await offlineService.getPendingMessages();
      console.log(`Syncing ${pendingMessages.length} pending messages...`);

      for (const message of pendingMessages) {
        try {
          const success = await this.syncMessage(message);
          if (success) {
            synced++;
            await offlineService.markMessageSent(message.messageId);
          } else {
            await offlineService.markMessageFailed(message.messageId);
            errors.push(`Failed to sync message ${message.messageId}`);
          }
        } catch (error) {
          await offlineService.markMessageFailed(message.messageId);
          errors.push(`Error syncing message ${message.messageId}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error getting pending messages: ${error}`);
    }

    return { synced, errors };
  }

  private async syncMessage(message: OfflineMessage): Promise<boolean> {
    // Simulate API call to send message
    try {
      const response = await this.callAPI('POST', '/messages', {
        id: message.messageId,
        threadId: message.threadId,
        senderId: message.senderId,
        text: message.text,
        timestamp: message.timestamp
      });

      return response.success;
    } catch (error) {
      console.error(`Error syncing message ${message.messageId}:`, error);
      return false;
    }
  }

  // Sync threads
  private async syncThreads(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const localThreads = await offlineService.getThreads();
      console.log(`Syncing ${localThreads.length} threads...`);

      for (const thread of localThreads) {
        try {
          const success = await this.syncThread(thread);
          if (success) {
            synced++;
          } else {
            errors.push(`Failed to sync thread ${thread.id}`);
          }
        } catch (error) {
          errors.push(`Error syncing thread ${thread.id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error getting local threads: ${error}`);
    }

    return { synced, errors };
  }

  private async syncThread(thread: Thread): Promise<boolean> {
    try {
      const response = await this.callAPI('PUT', `/threads/${thread.id}`, {
        id: thread.id,
        name: thread.name,
        participants: thread.participants,
        lastMessage: thread.lastMessage,
        unreadCount: thread.unreadCount
      });

      return response.success;
    } catch (error) {
      console.error(`Error syncing thread ${thread.id}:`, error);
      return false;
    }
  }

  // Sync users
  private async syncUsers(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const localUsers = await offlineService.getUsers();
      console.log(`Syncing ${localUsers.length} users...`);

      for (const user of localUsers) {
        try {
          const success = await this.syncUser(user);
          if (success) {
            synced++;
          } else {
            errors.push(`Failed to sync user ${user.id}`);
          }
        } catch (error) {
          errors.push(`Error syncing user ${user.id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error getting local users: ${error}`);
    }

    return { synced, errors };
  }

  private async syncUser(user: User): Promise<boolean> {
    try {
      const response = await this.callAPI('PUT', `/users/${user.id}`, {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt
      });

      return response.success;
    } catch (error) {
      console.error(`Error syncing user ${user.id}:`, error);
      return false;
    }
  }

  // Conflict resolution
  private async resolveConflicts(): Promise<{ resolved: number; errors: string[] }> {
    const errors: string[] = [];
    let resolved = 0;

    try {
      // Get conflicts from server
      const conflicts = await this.getConflicts();
      console.log(`Resolving ${conflicts.length} conflicts...`);

      for (const conflict of conflicts) {
        try {
          const resolution = await this.resolveConflict(conflict);
          if (resolution) {
            resolved++;
            await offlineService.resolveConflict(
              conflict.entityType,
              conflict.entityId,
              conflict.localData,
              conflict.remoteData,
              resolution.resolution
            );
          }
        } catch (error) {
          errors.push(`Error resolving conflict ${conflict.entityId}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error getting conflicts: ${error}`);
    }

    return { resolved, errors };
  }

  private async getConflicts(): Promise<ConflictResolution[]> {
    // Simulate getting conflicts from server
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            entityType: 'message',
            entityId: 'conflict-msg-1',
            localData: { text: 'Local version' },
            remoteData: { text: 'Remote version' },
            resolution: 'merge',
            resolvedAt: new Date()
          }
        ]);
      }, 100);
    });
  }

  private async resolveConflict(conflict: ConflictResolution): Promise<ConflictResolution | null> {
    // Simple conflict resolution strategy
    // In production, this would be more sophisticated
    
    if (conflict.entityType === 'message') {
      // For messages, prefer remote version (server is authoritative)
      return {
        ...conflict,
        resolution: 'remote'
      };
    } else if (conflict.entityType === 'thread') {
      // For threads, merge the data
      return {
        ...conflict,
        resolution: 'merge'
      };
    } else if (conflict.entityType === 'user') {
      // For users, prefer local version (user preferences)
      return {
        ...conflict,
        resolution: 'local'
      };
    }

    return null;
  }

  // API communication
  private async callAPI(method: string, endpoint: string, data?: any): Promise<any> {
    // Simulate API call with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
          return { success: true, data };
        } else {
          throw new Error(`API call failed (attempt ${attempt})`);
        }
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Periodic sync
  private startPeriodicSync(): void {
    setInterval(() => {
      if (!this.syncInProgress && offlineService.isConnected) {
        this.syncAll().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, this.syncInterval);
  }

  // Manual sync trigger
  async triggerSync(): Promise<SyncResult> {
    console.log('Manual sync triggered');
    return await this.syncAll();
  }

  // Get sync status
  getSyncStatus(): {
    inProgress: boolean;
    lastSyncTime: Date | null;
    nextSyncTime: Date;
  } {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime > 0 ? new Date(this.lastSyncTime) : null,
      nextSyncTime: new Date(this.lastSyncTime + this.syncInterval)
    };
  }

  // Force sync specific entity
  async syncEntity(entityType: 'message' | 'thread' | 'user', entityId: string): Promise<boolean> {
    try {
      switch (entityType) {
        case 'message':
          const messages = await offlineService.getPendingMessages();
          const message = messages.find(m => m.messageId === entityId);
          if (message) {
            return await this.syncMessage(message);
          }
          break;
        
        case 'thread':
          const threads = await offlineService.getThreads();
          const thread = threads.find(t => t.id === entityId);
          if (thread) {
            return await this.syncThread(thread);
          }
          break;
        
        case 'user':
          const users = await offlineService.getUsers();
          const user = users.find(u => u.id === entityId);
          if (user) {
            return await this.syncUser(user);
          }
          break;
      }
      
      return false;
    } catch (error) {
      console.error(`Error syncing ${entityType} ${entityId}:`, error);
      return false;
    }
  }

  // Clear sync data
  async clearSyncData(): Promise<void> {
    try {
      await offlineService.clearOldData(0); // Clear all old data
      console.log('Sync data cleared');
    } catch (error) {
      console.error('Error clearing sync data:', error);
      throw error;
    }
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    pendingMessages: number;
    failedMessages: number;
    totalThreads: number;
    totalUsers: number;
    conflictsResolved: number;
    lastSyncTime: Date | null;
    nextSyncTime: Date;
  }> {
    const offlineStats = await offlineService.getOfflineStats();
    const syncStatus = this.getSyncStatus();

    return {
      ...offlineStats,
      lastSyncTime: syncStatus.lastSyncTime,
      nextSyncTime: syncStatus.nextSyncTime
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Export types
export type { ConflictResolution };
