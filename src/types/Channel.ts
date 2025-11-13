/**
 * Channel Types
 *
 * This module defines the unified message format and channel-related types
 * used across all communication channels in the Communexus platform.
 *
 * The UnifiedMessage interface provides a consistent format for messages
 * regardless of their source channel (SMS, Messenger, Email, In-App).
 * This enables the core messaging logic to work uniformly across all channels.
 */

/**
 * Message status types
 * Extends the existing MessageStatus type with 'failed' status for channel messages
 */
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Channel type union
 * Defines all supported communication channels
 */
export type ChannelType = 'sms' | 'messenger' | 'email' | 'in-app';

/**
 * Message direction
 * Indicates whether the message is incoming or outgoing
 */
export type MessageDirection = 'incoming' | 'outgoing';

/**
 * Unified Message Interface
 *
 * This is the standard message format used across all channels in the system.
 * All messages from different channels (SMS, Messenger, Email, In-App) are
 * normalized to this format, allowing the core messaging logic to work
 * uniformly regardless of channel source.
 *
 * @example
 * ```typescript
 * const unifiedMessage: UnifiedMessage = {
 *   id: 'msg-123',
 *   threadId: 'thread-456',
 *   channel: 'sms',
 *   direction: 'incoming',
 *   senderIdentifier: '+15551234567',
 *   recipientIdentifier: '+15559876543',
 *   text: 'Hello from SMS',
 *   timestamp: new Date(),
 *   status: 'delivered',
 *   metadata: {
 *     channelSpecific: {
 *       twilioMessageSid: 'SM1234567890abcdef'
 *     }
 *   }
 * };
 * ```
 */
export interface UnifiedMessage {
  /**
   * Unique message identifier
   * @example 'msg-123', 'SM1234567890abcdef'
   */
  id: string;

  /**
   * Thread identifier this message belongs to
   * @example 'thread-456'
   */
  threadId: string;

  /**
   * Channel this message was sent/received through
   * @example 'sms', 'messenger', 'email', 'in-app'
   */
  channel: ChannelType;

  /**
   * Message direction
   * - 'incoming': Message received from external channel
   * - 'outgoing': Message sent to external channel
   */
  direction: MessageDirection;

  /**
   * Sender identifier in channel-specific format
   * - SMS: Phone number (e.g., '+15551234567')
   * - Messenger: Facebook Page-Scoped ID (PSID)
   * - Email: Email address (e.g., 'sender@example.com')
   * - In-App: User ID (e.g., 'user-123')
   */
  senderIdentifier: string;

  /**
   * Recipient identifier in channel-specific format
   * - SMS: Phone number (e.g., '+15559876543')
   * - Messenger: Facebook Page-Scoped ID (PSID)
   * - Email: Email address (e.g., 'recipient@example.com')
   * - In-App: User ID (e.g., 'user-456')
   */
  recipientIdentifier: string;

  /**
   * Message text content
   * @example 'Hello, this is a test message'
   */
  text: string;

  /**
   * Message timestamp
   * Represents when the message was sent (for outgoing) or received (for incoming)
   */
  timestamp: Date;

  /**
   * Current message status
   * - 'sending': Message is being sent (outgoing only)
   * - 'sent': Message has been sent but not yet delivered
   * - 'delivered': Message has been delivered to recipient
   * - 'read': Message has been read by recipient
   * - 'failed': Message sending failed (outgoing only)
   */
  status: MessageStatus;

  /**
   * Optional metadata for channel-specific data
   * Allows preserving channel-specific information without breaking the unified interface
   *
   * @example
   * ```typescript
   * metadata: {
   *   channelSpecific: {
   *     twilioMessageSid: 'SM1234567890abcdef',
   *     twilioAccountSid: 'AC1234567890abcdef'
   *   }
   * }
   * ```
   */
  metadata?: {
    /**
     * Channel-specific data preserved from webhooks or API responses
     * Structure varies by channel
     */
    channelSpecific?: any;
  };
}

/**
 * Channel Message
 *
 * Type alias for messages used when sending through a channel adapter.
 * This is typically a UnifiedMessage or a subset of UnifiedMessage fields
 * required for sending.
 *
 * @example
 * ```typescript
 * const channelMessage: ChannelMessage = {
 *   channel: 'sms',
 *   recipientIdentifier: '+15551234567',
 *   text: 'Hello from Communexus',
 *   // ... other UnifiedMessage fields
 * };
 * ```
 */
export type ChannelMessage = UnifiedMessage;

/**
 * Channel Message Result
 *
 * Result returned from ChannelAdapter.send() method.
 * Contains the channel-specific message ID and status returned by the channel provider.
 *
 * @example
 * ```typescript
 * const result: ChannelMessageResult = {
 *   channelMessageId: 'SM1234567890abcdef',
 *   status: 'sent',
 *   timestamp: new Date()
 * };
 * ```
 */
export interface ChannelMessageResult {
  /**
   * Channel-specific message ID returned by the provider
   * @example 'SM1234567890abcdef' (Twilio), 'mid.1234567890abcdef' (Facebook Messenger)
   */
  channelMessageId: string;

  /**
   * Message status returned by the provider
   * Typically 'sent' for successful sends, 'failed' for errors
   */
  status: MessageStatus;

  /**
   * Timestamp when the message was sent
   */
  timestamp: Date;

  /**
   * Optional error information if the send failed
   */
  error?: {
    code: string;
    message: string;
  };
}







