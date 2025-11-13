"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=adapter.js.map