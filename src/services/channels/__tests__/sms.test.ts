/**
 * Unit Tests for Twilio SMS Adapter
 *
 * These tests verify that:
 * - TwilioSMSAdapter implements ChannelAdapter interface
 * - send() method converts UnifiedMessage to Twilio format
 * - receive() method converts Twilio webhook to UnifiedMessage
 * - getStatus() method queries Twilio API for message status
 * - Error handling for invalid numbers, rate limits, carrier failures
 * - International phone number support (E.164 format)
 */

import { TwilioSMSAdapter } from '../sms';
import type { UnifiedMessage, ChannelMessage, MessageStatus } from '../../../types/Channel';
import Twilio from 'twilio';

// Mock Twilio SDK
const mockTwilioMessages = {
  create: jest.fn(),
};

// Mock for messages(messageId).fetch() pattern
const mockMessageInstance = {
  fetch: jest.fn(),
};

// Create messages mock function
const mockMessagesFunction = jest.fn((messageId: string) => mockMessageInstance) as any;
mockMessagesFunction.create = mockTwilioMessages.create;

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: mockMessagesFunction,
  }));
});

describe('TwilioSMSAdapter', () => {
  let adapter: TwilioSMSAdapter;
  let mockTwilioClient: any;

  const mockCredentials = {
    accountSid: 'AC00000000000000000000000000000000',
    authToken: 'test_auth_token',
    phoneNumber: '+15551234567',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Twilio client with messages as a function
    mockTwilioClient = {
      messages: mockMessagesFunction,
    };

    // Mock Twilio constructor
    (Twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);

    // Create adapter instance
    adapter = new TwilioSMSAdapter(mockCredentials);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Interface Implementation', () => {
    test('TwilioSMSAdapter implements ChannelAdapter interface', () => {
      expect(adapter.id).toBe('twilio-sms');
      expect(adapter.type).toBe('sms');
      expect(typeof adapter.send).toBe('function');
      expect(typeof adapter.receive).toBe('function');
      expect(typeof adapter.getStatus).toBe('function');
    });
  });

  describe('send() method', () => {
    const mockUnifiedMessage: UnifiedMessage = {
      id: 'msg-123',
      threadId: 'thread-456',
      channel: 'sms',
      direction: 'outgoing',
      senderIdentifier: '+15559876543',
      recipientIdentifier: '+15551234567',
      text: 'Hello from Communexus',
      timestamp: new Date(),
      status: 'sending',
    };

    test('send() converts UnifiedMessage to Twilio format and calls Twilio API', async () => {
      // Mock Twilio API response
      const mockTwilioResponse = {
        sid: 'SM1234567890abcdef',
        status: 'sent',
        dateCreated: new Date(),
      };

      mockTwilioMessages.create.mockResolvedValue(mockTwilioResponse);

      // Send message
      const result = await adapter.send(mockUnifiedMessage);

      // Verify Twilio API was called with correct parameters
      expect(mockTwilioMessages.create).toHaveBeenCalledWith({
        to: '+15551234567',
        from: '+15559876543',
        body: 'Hello from Communexus',
      });

      // Verify result
      expect(result.channelMessageId).toBe('SM1234567890abcdef');
      expect(result.status).toBe('sent');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('send() uses configured Twilio phone number if senderIdentifier not provided', async () => {
      const messageWithoutSender: UnifiedMessage = {
        ...mockUnifiedMessage,
        senderIdentifier: '',
      };

      const mockTwilioResponse = {
        sid: 'SM1234567890abcdef',
        status: 'sent',
        dateCreated: new Date(),
      };

      mockTwilioMessages.create.mockResolvedValue(mockTwilioResponse);

      await adapter.send(messageWithoutSender);

      // Verify Twilio API was called with configured phone number
      expect(mockTwilioMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '+15551234567', // Configured Twilio phone number
        })
      );
    });

    test('send() validates phone number format (E.164)', async () => {
      const messageWithInvalidPhone: UnifiedMessage = {
        ...mockUnifiedMessage,
        recipientIdentifier: 'invalid-phone',
      };

      const result = await adapter.send(messageWithInvalidPhone);

      // Verify error handling
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid phone number format');
    });

    test('send() handles Twilio API errors', async () => {
      // Mock Twilio API error (invalid phone number)
      const twilioError = new Error('Unable to create record: (21211) Invalid \'To\' Phone Number');
      mockTwilioMessages.create.mockRejectedValue(twilioError);

      const result = await adapter.send(mockUnifiedMessage);

      // Verify error handling
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('21211');
      expect(result.error?.message).toContain('Invalid');
    });

    test('send() handles international phone numbers', async () => {
      const internationalMessage: UnifiedMessage = {
        ...mockUnifiedMessage,
        recipientIdentifier: '+441234567890', // UK phone number
      };

      const mockTwilioResponse = {
        sid: 'SM1234567890abcdef',
        status: 'sent',
        dateCreated: new Date(),
      };

      mockTwilioMessages.create.mockResolvedValue(mockTwilioResponse);

      const result = await adapter.send(internationalMessage);

      // Verify international phone number was accepted
      expect(result.status).toBe('sent');
        expect(mockTwilioMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+441234567890',
        })
      );
    });
  });

  describe('receive() method', () => {
    test('receive() converts Twilio webhook to UnifiedMessage', () => {
      const webhookPayload = {
        MessageSid: 'SM1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        Body: 'Hello from SMS',
        Timestamp: '1234567890',
        MessageStatus: 'delivered',
        AccountSid: 'AC00000000000000000000000000000000',
        NumMedia: '0',
        NumSegments: '1',
      };

      const unifiedMessage = adapter.receive(webhookPayload);

      // Verify UnifiedMessage structure
      expect(unifiedMessage.id).toBe('SM1234567890abcdef');
      expect(unifiedMessage.channel).toBe('sms');
      expect(unifiedMessage.direction).toBe('incoming');
      expect(unifiedMessage.senderIdentifier).toBe('+15551234567');
      expect(unifiedMessage.recipientIdentifier).toBe('+15559876543');
      expect(unifiedMessage.text).toBe('Hello from SMS');
      expect(unifiedMessage.status).toBe('delivered');
      expect(unifiedMessage.timestamp).toBeInstanceOf(Date);
      expect(unifiedMessage.metadata?.channelSpecific?.twilioMessageSid).toBe('SM1234567890abcdef');
    });

    test('receive() throws error for invalid webhook payload', () => {
      const invalidWebhook = {
        // Missing required fields
      };

      expect(() => adapter.receive(invalidWebhook)).toThrow('Invalid webhook payload');
    });

    test('receive() handles international phone numbers', () => {
      const webhookPayload = {
        MessageSid: 'SM1234567890abcdef',
        From: '+441234567890', // UK phone number
        To: '+15559876543',
        Body: 'Hello from UK',
        Timestamp: '1234567890',
        MessageStatus: 'delivered',
        AccountSid: 'AC00000000000000000000000000000000',
      };

      const unifiedMessage = adapter.receive(webhookPayload);

      // Verify international phone number was handled
      expect(unifiedMessage.senderIdentifier).toBe('+441234567890');
    });
  });

  describe('getStatus() method', () => {
    test('getStatus() queries Twilio API for message status', async () => {
      const messageSid = 'SM1234567890abcdef';

      // Mock Twilio API response
      const mockTwilioMessage = {
        sid: messageSid,
        status: 'delivered',
      };

      mockMessageInstance.fetch.mockResolvedValue(mockTwilioMessage);

      const status = await adapter.getStatus(messageSid);

      // Verify Twilio API was called
      expect(mockTwilioClient.messages).toHaveBeenCalledWith(messageSid);
      expect(mockMessageInstance.fetch).toHaveBeenCalled();

      // Verify status mapping
      expect(status).toBe('delivered');
    });

    test('getStatus() maps Twilio status to UnifiedMessage status', async () => {
      const statusMap: Record<string, MessageStatus> = {
        queued: 'sending',
        sending: 'sending',
        sent: 'sent',
        delivered: 'delivered',
        read: 'read',
        failed: 'failed',
      };

      for (const [twilioStatus, expectedStatus] of Object.entries(statusMap)) {
        // Reset mock before each iteration
        mockMessageInstance.fetch.mockResolvedValueOnce({
          sid: 'SM1234567890abcdef',
          status: twilioStatus,
        });

        const status = await adapter.getStatus('SM1234567890abcdef');
        expect(status).toBe(expectedStatus);
      }
    });

    test('getStatus() returns failed status on error', async () => {
      const messageSid = 'SM1234567890abcdef';

      // Mock Twilio API error
      mockMessageInstance.fetch.mockRejectedValue(new Error('Message not found'));

      const status = await adapter.getStatus(messageSid);

      // Verify error handling
      expect(status).toBe('failed');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid phone numbers (Twilio error 21211)', async () => {
      const messageWithInvalidPhone: UnifiedMessage = {
        id: 'msg-123',
        threadId: 'thread-456',
        channel: 'sms',
        direction: 'outgoing',
        senderIdentifier: '+15559876543',
        recipientIdentifier: 'invalid',
        text: 'Hello',
        timestamp: new Date(),
        status: 'sending',
      };

      const result = await adapter.send(messageWithInvalidPhone);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    test('handles rate limit errors (Twilio error 20003)', async () => {
      const mockUnifiedMessage: UnifiedMessage = {
        id: 'msg-123',
        threadId: 'thread-456',
        channel: 'sms',
        direction: 'outgoing',
        senderIdentifier: '+15559876543',
        recipientIdentifier: '+15551234567',
        text: 'Hello',
        timestamp: new Date(),
        status: 'sending',
      };

      const rateLimitError = new Error('Unable to create record: (20003) Rate limit exceeded');
      mockTwilioMessages.create.mockRejectedValue(rateLimitError);

      const result = await adapter.send(mockUnifiedMessage);

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('20003');
    });

    test('handles carrier failures (Twilio error 30008)', async () => {
      const mockUnifiedMessage: UnifiedMessage = {
        id: 'msg-123',
        threadId: 'thread-456',
        channel: 'sms',
        direction: 'outgoing',
        senderIdentifier: '+15559876543',
        recipientIdentifier: '+15551234567',
        text: 'Hello',
        timestamp: new Date(),
        status: 'sending',
      };

      const carrierError = new Error('Unable to create record: (30008) Carrier failure');
      mockTwilioMessages.create.mockRejectedValue(carrierError);

      const result = await adapter.send(mockUnifiedMessage);

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('30008');
    });
  });

  describe('International Phone Number Support', () => {
    test('validates E.164 format', async () => {
      const validFormats = [
        '+15551234567', // US
        '+441234567890', // UK
        '+33123456789', // France
        '+8612345678901', // China
      ];

      for (const phoneNumber of validFormats) {
        const message: UnifiedMessage = {
          id: 'msg-123',
          threadId: 'thread-456',
          channel: 'sms',
          direction: 'outgoing',
          senderIdentifier: '+15559876543',
          recipientIdentifier: phoneNumber,
          text: 'Hello',
          timestamp: new Date(),
          status: 'sending',
        };

        mockTwilioMessages.create.mockResolvedValue({
          sid: 'SM1234567890abcdef',
          status: 'sent',
          dateCreated: new Date(),
        });

        const result = await adapter.send(message);

        // Should not throw error for valid formats
        expect(result.status).toBe('sent');
      }
    });

    test('rejects invalid phone number formats', async () => {
      const invalidFormats = [
        '15551234567', // Missing +
        '+155512345678901234', // Too long (17 digits after +)
        'invalid', // Not a number
        '+0123456789', // Starts with 0 (invalid country code)
      ];

      for (const phoneNumber of invalidFormats) {
        const message: UnifiedMessage = {
          id: 'msg-123',
          threadId: 'thread-456',
          channel: 'sms',
          direction: 'outgoing',
          senderIdentifier: '+15559876543',
          recipientIdentifier: phoneNumber,
          text: 'Hello',
          timestamp: new Date(),
          status: 'sending',
        };

        const result = await adapter.send(message);

        expect(result.status).toBe('failed');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Invalid phone number format');
      }
    });
  });
});

