/**
 * Channel Adapter Interface
 *
 * This interface defines the contract that all channel implementations must follow.
 * It enables clean separation of concerns and extensibility for future channels
 * (SMS, Messenger, Email, WhatsApp, etc.).
 *
 * The Channel Adapter Pattern allows:
 * - New channels to be integrated without modifying core messaging logic
 * - Channel-specific logic to be isolated in adapter implementations
 * - Unified message format (UnifiedMessage) across all channels
 * - Consistent API for sending, receiving, and status checking
 *
 * @example
 * ```typescript
 * class TwilioSMSAdapter implements ChannelAdapter {
 *   id = 'twilio-sms';
 *   type = 'sms' as const;
 *
 *   async send(message: ChannelMessage): Promise<ChannelMessageResult> {
 *     // Convert UnifiedMessage to Twilio format
 *     // Call Twilio API
 *     // Return normalized result
 *   }
 *
 *   receive(webhookPayload: any): UnifiedMessage {
 *     // Convert Twilio webhook to UnifiedMessage
 *     // Extract sender/recipient identifiers
 *     // Normalize timestamp and status
 *   }
 *
 *   async getStatus(messageId: string): Promise<MessageStatus> {
 *     // Query Twilio API for message status
 *     // Return normalized status
 *   }
 * }
 * ```
 */

import type {
  UnifiedMessage,
  ChannelMessage,
  ChannelMessageResult,
  MessageStatus,
} from '../../types/Channel';

/**
 * Channel Adapter Interface
 *
 * All channel implementations must implement this interface to ensure
 * consistent behavior across different communication channels.
 */
export interface ChannelAdapter {
  /**
   * Unique identifier for this adapter instance
   * @example 'twilio-sms', 'facebook-messenger', 'sendgrid-email'
   */
  id: string;

  /**
   * Channel type this adapter handles
   * @example 'sms', 'messenger', 'email', 'in-app'
   */
  type: 'sms' | 'messenger' | 'email' | 'in-app';

  /**
   * Send a message via this channel
   *
   * Converts a ChannelMessage (typically a UnifiedMessage) to the channel-specific
   * format and sends it through the channel's API. Returns a normalized result
   * containing the channel-specific message ID and status.
   *
   * @param message - The message to send, containing channel, recipient, and content
   * @returns Promise resolving to the send result with channel message ID and status
   * @throws Error if the message cannot be sent (e.g., invalid recipient, API error)
   *
   * @example
   * ```typescript
   * const result = await adapter.send({
   *   channel: 'sms',
   *   recipientIdentifier: '+15551234567',
   *   text: 'Hello from Communexus',
   *   // ... other UnifiedMessage fields
   * });
   * console.log(result.channelMessageId); // 'SM1234567890abcdef'
   * console.log(result.status); // 'sent'
   * ```
   */
  send(message: ChannelMessage): Promise<ChannelMessageResult>;

  /**
   * Receive a webhook payload and convert it to UnifiedMessage format
   *
   * This method is called when a webhook is received from the channel provider.
   * It normalizes the channel-specific webhook payload into the unified message
   * format used by the core messaging system.
   *
   * @param webhookPayload - The raw webhook payload from the channel provider
   * @returns UnifiedMessage in the standard format
   * @throws Error if the webhook payload cannot be parsed or is invalid
   *
   * @example
   * ```typescript
   * const unifiedMessage = adapter.receive(twilioWebhookPayload);
   * // unifiedMessage now has:
   * // - channel: 'sms'
   * // - senderIdentifier: '+15551234567'
   * // - text: 'Hello'
   * // - direction: 'incoming'
   * // ... all other UnifiedMessage fields
   * ```
   */
  receive(webhookPayload: any): UnifiedMessage;

  /**
   * Get the current status of a message sent via this channel
   *
   * Queries the channel provider's API to retrieve the current delivery status
   * of a message. This is useful for tracking message delivery and read receipts.
   *
   * @param messageId - The channel-specific message ID (from send() result)
   * @returns Promise resolving to the current message status
   * @throws Error if the message ID is invalid or the status cannot be retrieved
   *
   * @example
   * ```typescript
   * const status = await adapter.getStatus('SM1234567890abcdef');
   * console.log(status); // 'delivered' | 'read' | 'failed'
   * ```
   */
  getStatus(messageId: string): Promise<MessageStatus>;
}
