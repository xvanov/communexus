/**
 * SMS Channel Adapter (Twilio Integration)
 *
 * This module implements the SMS channel adapter using Twilio's API.
 * It provides integration for sending and receiving SMS messages via Twilio,
 * converting between Twilio's format and the UnifiedMessage format.
 *
 * @example
 * ```typescript
 * import { TwilioSMSAdapter } from './sms';
 * import { UnifiedMessage } from '../../types/Channel';
 *
 * const adapter = new TwilioSMSAdapter({
 *   accountSid: process.env.TWILIO_ACCOUNT_SID!,
 *   authToken: process.env.TWILIO_AUTH_TOKEN!,
 *   phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
 * });
 *
 * // Send a message
 * const message: UnifiedMessage = {
 *   id: 'msg-123',
 *   threadId: 'thread-456',
 *   channel: 'sms',
 *   direction: 'outgoing',
 *   senderIdentifier: '+15559876543',
 *   recipientIdentifier: '+15551234567',
 *   text: 'Hello from Communexus',
 *   timestamp: new Date(),
 *   status: 'sending',
 * };
 *
 * const result = await adapter.send(message);
 * console.log(`Message sent: ${result.channelMessageId}`);
 * ```
 */

import type { ChannelAdapter } from './adapter';
import type {
  UnifiedMessage,
  ChannelMessage,
  ChannelMessageResult,
  MessageStatus,
} from '../../types/Channel';
import { getTwilioClient, type TwilioCredentials } from './twilioConfig';
import { mapTwilioStatusToUnifiedStatus } from './twilioStatusMapper';
import Twilio from 'twilio';

/**
 * Twilio SMS Adapter
 *
 * Implements the ChannelAdapter interface for SMS messages via Twilio.
 * This adapter handles:
 * - Sending SMS messages via Twilio API
 * - Receiving SMS webhooks from Twilio
 * - Checking message delivery status
 * - Converting between Twilio and UnifiedMessage formats
 * - Error handling for invalid numbers, rate limits, carrier failures
 * - International phone number support (E.164 format)
 */
export class TwilioSMSAdapter implements ChannelAdapter {
  /**
   * Unique identifier for this adapter instance
   */
  id = 'twilio-sms';

  /**
   * Channel type this adapter handles
   */
  type = 'sms' as const;

  /**
   * Twilio client instance
   */
  private twilioClient: Twilio.Twilio;

  /**
   * Twilio phone number (E.164 format)
   */
  private twilioPhoneNumber: string;

  /**
   * Twilio credentials
   */
  private credentials: TwilioCredentials;

  /**
   * Create a new Twilio SMS Adapter instance
   *
   * @param credentials - Twilio credentials (accountSid, authToken, phoneNumber)
   * @throws Error if credentials are invalid
   */
  constructor(credentials: TwilioCredentials) {
    this.credentials = credentials;
    this.twilioPhoneNumber = credentials.phoneNumber;
    this.twilioClient = getTwilioClient(credentials);
  }

  /**
   * Send a message via Twilio SMS
   *
   * Converts a UnifiedMessage to Twilio format and sends it through the Twilio API.
   * Returns a normalized result containing the Twilio message SID and status.
   *
   * @param message - The message to send in UnifiedMessage format
   * @returns Promise resolving to the send result with Twilio message SID and status
   * @throws Error if the message cannot be sent (e.g., invalid recipient, API error)
   *
   * @example
   * ```typescript
   * const message: UnifiedMessage = {
   *   channel: 'sms',
   *   recipientIdentifier: '+15551234567',
   *   text: 'Hello from Communexus',
   *   // ... other UnifiedMessage fields
   * };
   *
   * const result = await adapter.send(message);
   * console.log(result.channelMessageId); // 'SM1234567890abcdef'
   * ```
   */
  async send(message: ChannelMessage): Promise<ChannelMessageResult> {
    try {
      // Validate phone number format (E.164)
      this.validatePhoneNumber(message.recipientIdentifier);

      // Extract sender phone number (use configured Twilio number if not provided)
      const fromPhoneNumber =
        message.senderIdentifier || this.twilioPhoneNumber;

      // Convert UnifiedMessage to Twilio format
      const twilioMessage: {
        to: string;
        from: string;
        body: string;
        statusCallback?: string;
        statusCallbackMethod?: string;
      } = {
        to: message.recipientIdentifier,
        from: fromPhoneNumber,
        body: message.text,
      };

      // Handle Twilio-specific options from metadata
      if (message.metadata?.channelSpecific) {
        const twilioOptions = message.metadata.channelSpecific;
        if (twilioOptions.statusCallback) {
          twilioMessage.statusCallback = twilioOptions.statusCallback;
        }
        if (twilioOptions.statusCallbackMethod) {
          twilioMessage.statusCallbackMethod =
            twilioOptions.statusCallbackMethod;
        }
      }

      // Call Twilio API to send SMS
      const twilioResult = await this.twilioClient.messages.create(
        twilioMessage
      );

      // Convert Twilio response to ChannelMessageResult
      return {
        channelMessageId: twilioResult.sid,
        status: mapTwilioStatusToUnifiedStatus(twilioResult.status),
        timestamp: new Date(
          twilioResult.dateCreated
            ? new Date(twilioResult.dateCreated).getTime()
            : Date.now()
        ),
      };
    } catch (error) {
      // Handle all error types gracefully
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const twilioError = this.parseTwilioError(
        error instanceof Error ? error : new Error(errorMessage)
      );

      return {
        channelMessageId: '',
        status: 'failed',
        timestamp: new Date(),
        error: {
          code: twilioError.code,
          message: twilioError.message,
        },
      };
    }
  }

  /**
   * Receive a Twilio webhook payload and convert it to UnifiedMessage format
   *
   * This method is called when a webhook is received from Twilio.
   * It normalizes the Twilio webhook payload into the UnifiedMessage format
   * used by the core messaging system.
   *
   * @param webhookPayload - The raw webhook payload from Twilio
   * @returns UnifiedMessage in the standard format
   * @throws Error if the webhook payload cannot be parsed or is invalid
   *
   * @example
   * ```typescript
   * const webhookPayload = {
   *   MessageSid: 'SM1234567890abcdef',
   *   From: '+15551234567',
   *   To: '+15559876543',
   *   Body: 'Hello',
   *   Timestamp: '1234567890',
   * };
   *
   * const unifiedMessage = adapter.receive(webhookPayload);
   * ```
   */
  receive(webhookPayload: any): UnifiedMessage {
    // Validate required fields
    if (!webhookPayload.MessageSid) {
      throw new Error('Invalid webhook payload: MessageSid is required');
    }
    if (!webhookPayload.From) {
      throw new Error('Invalid webhook payload: From is required');
    }
    if (!webhookPayload.To) {
      throw new Error('Invalid webhook payload: To is required');
    }

    // Convert Twilio webhook to UnifiedMessage
    const unifiedMessage: UnifiedMessage = {
      id: webhookPayload.MessageSid,
      threadId: '', // Will be determined by routing logic
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: webhookPayload.From,
      recipientIdentifier: webhookPayload.To,
      text: webhookPayload.Body || '',
      timestamp: this.parseTwilioTimestamp(webhookPayload.Timestamp),
      status: mapTwilioStatusToUnifiedStatus(
        webhookPayload.MessageStatus || 'delivered'
      ),
      metadata: {
        channelSpecific: {
          twilioMessageSid: webhookPayload.MessageSid,
          twilioAccountSid: webhookPayload.AccountSid,
          twilioNumMedia: webhookPayload.NumMedia || '0',
          twilioNumSegments: webhookPayload.NumSegments || '1',
        },
      },
    };

    return unifiedMessage;
  }

  /**
   * Get the current status of a message sent via Twilio
   *
   * Queries the Twilio API to retrieve the current delivery status of a message.
   * This is useful for tracking message delivery and read receipts.
   *
   * @param messageId - The Twilio message SID (from send() result)
   * @returns Promise resolving to the current message status
   * @throws Error if the message ID is invalid or the status cannot be retrieved
   *
   * @example
   * ```typescript
   * const status = await adapter.getStatus('SM1234567890abcdef');
   * console.log(status); // 'delivered' | 'read' | 'failed'
   * ```
   */
  async getStatus(messageId: string): Promise<MessageStatus> {
    try {
      // Query Twilio API for message status
      const message = await this.twilioClient.messages(messageId).fetch();

      // Map Twilio status to UnifiedMessage status
      return mapTwilioStatusToUnifiedStatus(message.status);
    } catch (error) {
      // If message not found or other error, return 'failed'
      console.error(`Failed to get status for message ${messageId}:`, error);
      return 'failed';
    }
  }


  /**
   * Parse Twilio timestamp to Date object
   *
   * @param timestamp - Twilio timestamp (string or number)
   * @returns Date object
   */
  private parseTwilioTimestamp(timestamp: string | number | undefined): Date {
    if (!timestamp) {
      return new Date();
    }

    // Twilio timestamps can be in seconds (number or string)
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const timestampMs =
        typeof timestamp === 'string'
          ? parseInt(timestamp, 10) * 1000
          : timestamp * 1000;
      return new Date(timestampMs);
    }

    return new Date();
  }

  /**
   * Validate phone number format (E.164)
   *
   * @param phoneNumber - Phone number to validate
   * @throws Error if phone number format is invalid
   */
  private validatePhoneNumber(phoneNumber: string): void {
    // E.164 format: +[country code][number] (max 15 digits)
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    if (!e164Pattern.test(phoneNumber)) {
      throw new Error(
        `Invalid phone number format. Expected E.164 format (e.g., +15551234567), got: ${phoneNumber}`
      );
    }
  }

  /**
   * Parse Twilio error and extract error code and message
   *
   * @param error - Error object from Twilio API
   * @returns Parsed error with code and message
   */
  private parseTwilioError(error: Error): { code: string; message: string } {
    // Twilio errors typically include code and message
    // Common error codes:
    // 21211: Invalid phone number
    // 20003: Rate limit exceeded
    // 30008: Carrier failure
    // 21610: Unsubscribed number

    const errorMessage = error.message || 'Unknown error';
    let errorCode = 'UNKNOWN';

    // Extract error code from message if present
    const codeMatch = errorMessage.match(/\((\d+)\)/);
    if (codeMatch && codeMatch[1]) {
      errorCode = codeMatch[1];
    }

    return {
      code: errorCode,
      message: errorMessage,
    };
  }
}

