// Message.ts - Message data model and TypeScript interfaces
// TODO: Define complete Message interface based on Firestore schema
import type { ChannelType } from './Channel';

/**
 * Message data model
 * 
 * Represents a message in a thread that can originate from multiple channels.
 * The channel field indicates the source channel, and related fields provide
 * channel-specific identifiers and metadata for proper display and routing.
 */
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  deliveredTo: string[];
  readBy: string[];
  readTimestamps: Record<string, Date>;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  priority?: 'urgent' | 'high' | 'normal';
  isDecision?: boolean;
  deleted?: boolean;
  /**
   * Channel this message was sent/received through
   * @example 'sms', 'messenger', 'email', 'in-app'
   * @default undefined (in-app for backward compatibility)
   */
  channel?: ChannelType;
  /**
   * Channel-specific message ID from the external provider
   * @example 'SM1234567890abcdef' (Twilio), 'mid.1234567890abcdef' (Facebook Messenger)
   * @default undefined
   */
  channelMessageId?: string;
  /**
   * Sender identifier in channel-specific format
   * - SMS: Phone number (e.g., '+15551234567')
   * - Messenger: Facebook Page-Scoped ID (PSID)
   * - Email: Email address (e.g., 'sender@example.com')
   * - In-App: User ID (e.g., 'user-123')
   * @example '+15551234567'
   * @default undefined
   */
  senderIdentifier?: string;
  /**
   * Recipient identifier in channel-specific format
   * - SMS: Phone number (e.g., '+15559876543')
   * - Messenger: Facebook Page-Scoped ID (PSID)
   * - Email: Email address (e.g., 'recipient@example.com')
   * - In-App: User ID (e.g., 'user-456')
   * @example '+15559876543'
   * @default undefined
   */
  recipientIdentifier?: string;
  /**
   * Message direction
   * - 'incoming': Message received from external channel
   * - 'outgoing': Message sent to external channel
   * @example 'incoming'
   * @default undefined (outgoing for backward compatibility)
   */
  direction?: 'incoming' | 'outgoing';
  /**
   * Channel-specific metadata preserved from webhooks or API responses
   * Allows storing channel-specific data without breaking the unified interface
   * @example { twilioMessageSid: 'SM1234567890abcdef', twilioAccountSid: 'AC1234567890abcdef' }
   * @default undefined
   */
  channelMetadata?: Record<string, any>;
}
