// Thread.ts - Thread data model and TypeScript interfaces
// TODO: Define complete Thread interface based on Firestore schema
import type { ChannelType } from './Channel';

/**
 * Thread data model
 * 
 * Represents a conversation thread that can contain messages from multiple channels.
 * The channelSources array tracks which channels have been used in this thread,
 * enabling efficient filtering and UI display without scanning all messages.
 */
export interface Thread {
  id: string;
  participants: string[];
  participantDetails: {
    id: string;
    name: string;
    photoUrl?: string;
  }[];
  isGroup: boolean;
  groupName?: string;
  groupPhotoUrl?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Array of channel types that have been used in this thread.
   * Enables efficient filtering and UI display without scanning all messages.
   * 
   * @example ['sms', 'messenger', 'email']
   * @default undefined (empty array for backward compatibility)
   */
  channelSources?: ChannelType[];
}
