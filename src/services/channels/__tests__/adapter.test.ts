/**
 * Unit Tests for Channel Adapter Interface
 *
 * These tests verify that:
 * - ChannelAdapter interface can be implemented
 * - UnifiedMessage type structure is correctly defined
 * - Type exports are accessible from barrel exports
 *
 * This is a pure type definition story - no runtime behavior to test,
 * only type structure validation.
 */

import type { ChannelAdapter } from '../adapter';
import type {
  UnifiedMessage,
  ChannelMessage,
  ChannelMessageResult,
  MessageStatus,
  ChannelType,
  MessageDirection,
} from '../../../types/Channel';

describe('ChannelAdapter Interface', () => {
  /**
   * Test that ChannelAdapter interface can be implemented
   * This verifies the interface contract is valid and can be used
   */
  test('ChannelAdapter interface can be implemented', () => {
    // Create a mock adapter class that implements ChannelAdapter
    class MockSMSAdapter implements ChannelAdapter {
      id = 'mock-sms';
      type: ChannelType = 'sms';

      async send(message: ChannelMessage): Promise<ChannelMessageResult> {
        return {
          channelMessageId: 'SM1234567890abcdef',
          status: 'sent',
          timestamp: new Date(),
        };
      }

      receive(webhookPayload: any): UnifiedMessage {
        return {
          id: 'msg-123',
          threadId: 'thread-456',
          channel: 'sms',
          direction: 'incoming',
          senderIdentifier: '+15551234567',
          recipientIdentifier: '+15559876543',
          text: 'Test message',
          timestamp: new Date(),
          status: 'delivered',
        };
      }

      async getStatus(messageId: string): Promise<MessageStatus> {
        return 'delivered';
      }
    }

    // Verify the adapter can be instantiated and implements all required methods
    const adapter = new MockSMSAdapter();
    expect(adapter.id).toBe('mock-sms');
    expect(adapter.type).toBe('sms');
    expect(typeof adapter.send).toBe('function');
    expect(typeof adapter.receive).toBe('function');
    expect(typeof adapter.getStatus).toBe('function');
  });

  /**
   * Test that ChannelAdapter interface requires all methods
   * TypeScript compile-time check ensures this, but we verify runtime structure
   */
  test('ChannelAdapter interface requires id, type, send, receive, and getStatus', () => {
    class CompleteAdapter implements ChannelAdapter {
      id = 'complete';
      type: ChannelType = 'in-app';

      async send(message: ChannelMessage): Promise<ChannelMessageResult> {
        return {
          channelMessageId: 'complete-123',
          status: 'sent',
          timestamp: new Date(),
        };
      }

      receive(webhookPayload: any): UnifiedMessage {
        return {
          id: 'msg-complete',
          threadId: 'thread-complete',
          channel: 'in-app',
          direction: 'incoming',
          senderIdentifier: 'user-1',
          recipientIdentifier: 'user-2',
          text: 'Complete message',
          timestamp: new Date(),
          status: 'sent',
        };
      }

      async getStatus(messageId: string): Promise<MessageStatus> {
        return 'sent';
      }
    }

    const adapter = new CompleteAdapter();
    // Verify all required properties exist
    expect(adapter).toHaveProperty('id');
    expect(adapter).toHaveProperty('type');
    expect(adapter).toHaveProperty('send');
    expect(adapter).toHaveProperty('receive');
    expect(adapter).toHaveProperty('getStatus');
  });
});

describe('UnifiedMessage Type Structure', () => {
  /**
   * Test UnifiedMessage type structure with all required fields
   */
  test('UnifiedMessage has all required fields', () => {
    const message: UnifiedMessage = {
      id: 'msg-123',
      threadId: 'thread-456',
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: '+15551234567',
      recipientIdentifier: '+15559876543',
      text: 'Hello from SMS',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        channelSpecific: {
          twilioMessageSid: 'SM1234567890abcdef',
        },
      },
    };

    // Verify all required fields exist
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('threadId');
    expect(message).toHaveProperty('channel');
    expect(message).toHaveProperty('direction');
    expect(message).toHaveProperty('senderIdentifier');
    expect(message).toHaveProperty('recipientIdentifier');
    expect(message).toHaveProperty('text');
    expect(message).toHaveProperty('timestamp');
    expect(message).toHaveProperty('status');

    // Verify field types
    expect(typeof message.id).toBe('string');
    expect(typeof message.threadId).toBe('string');
    expect(typeof message.channel).toBe('string');
    expect(typeof message.direction).toBe('string');
    expect(typeof message.senderIdentifier).toBe('string');
    expect(typeof message.recipientIdentifier).toBe('string');
    expect(typeof message.text).toBe('string');
    expect(message.timestamp).toBeInstanceOf(Date);
    expect(typeof message.status).toBe('string');
  });

  /**
   * Test UnifiedMessage with optional metadata field
   */
  test('UnifiedMessage metadata field is optional', () => {
    const messageWithoutMetadata: UnifiedMessage = {
      id: 'msg-456',
      threadId: 'thread-789',
      channel: 'email',
      direction: 'outgoing',
      senderIdentifier: 'sender@example.com',
      recipientIdentifier: 'recipient@example.com',
      text: 'Hello from Email',
      timestamp: new Date(),
      status: 'sent',
      // metadata is optional, so it can be omitted
    };

    expect(messageWithoutMetadata).toHaveProperty('id');
    expect(messageWithoutMetadata).not.toHaveProperty('metadata');
  });

  /**
   * Test UnifiedMessage with different channel types
   */
  test('UnifiedMessage supports all channel types', () => {
    const smsMessage: UnifiedMessage = {
      id: 'msg-sms',
      threadId: 'thread-1',
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: '+15551234567',
      recipientIdentifier: '+15559876543',
      text: 'SMS message',
      timestamp: new Date(),
      status: 'delivered',
    };

    const messengerMessage: UnifiedMessage = {
      id: 'msg-messenger',
      threadId: 'thread-2',
      channel: 'messenger',
      direction: 'incoming',
      senderIdentifier: 'psid-123456',
      recipientIdentifier: 'psid-789012',
      text: 'Messenger message',
      timestamp: new Date(),
      status: 'read',
    };

    const emailMessage: UnifiedMessage = {
      id: 'msg-email',
      threadId: 'thread-3',
      channel: 'email',
      direction: 'outgoing',
      senderIdentifier: 'sender@example.com',
      recipientIdentifier: 'recipient@example.com',
      text: 'Email message',
      timestamp: new Date(),
      status: 'sent',
    };

    const inAppMessage: UnifiedMessage = {
      id: 'msg-inapp',
      threadId: 'thread-4',
      channel: 'in-app',
      direction: 'incoming',
      senderIdentifier: 'user-123',
      recipientIdentifier: 'user-456',
      text: 'In-app message',
      timestamp: new Date(),
      status: 'delivered',
    };

    expect(smsMessage.channel).toBe('sms');
    expect(messengerMessage.channel).toBe('messenger');
    expect(emailMessage.channel).toBe('email');
    expect(inAppMessage.channel).toBe('in-app');
  });

  /**
   * Test UnifiedMessage with all status types
   */
  test('UnifiedMessage supports all status types', () => {
    const statuses: MessageStatus[] = [
      'sending',
      'sent',
      'delivered',
      'read',
      'failed',
    ];

    statuses.forEach(status => {
      const message: UnifiedMessage = {
        id: `msg-${status}`,
        threadId: 'thread-1',
        channel: 'sms',
        direction: 'outgoing',
        senderIdentifier: '+15551234567',
        recipientIdentifier: '+15559876543',
        text: `Message with ${status} status`,
        timestamp: new Date(),
        status,
      };

      expect(message.status).toBe(status);
    });
  });
});

describe('Type Exports', () => {
  /**
   * Test that type exports are accessible from barrel exports
   */
  test('ChannelAdapter type is accessible from barrel export', () => {
    // This test verifies that the type can be imported
    // TypeScript compile-time check ensures this works
    // We verify by ensuring the import doesn't cause runtime errors
    // and that we can create a class that implements the interface
    class TestAdapter implements ChannelAdapter {
      id = 'test';
      type: ChannelType = 'sms';
      async send(message: ChannelMessage): Promise<ChannelMessageResult> {
        return {
          channelMessageId: 'test',
          status: 'sent',
          timestamp: new Date(),
        };
      }
      receive(webhookPayload: any): UnifiedMessage {
        return {
          id: 'test',
          threadId: 'thread',
          channel: 'sms',
          direction: 'incoming',
          senderIdentifier: '+1',
          recipientIdentifier: '+2',
          text: 'test',
          timestamp: new Date(),
          status: 'sent',
        };
      }
      async getStatus(messageId: string): Promise<MessageStatus> {
        return 'sent';
      }
    }
    const adapter = new TestAdapter();
    expect(adapter.id).toBe('test');
  });

  /**
   * Test that UnifiedMessage and related types are accessible
   */
  test('UnifiedMessage and related types are accessible', () => {
    // Create instances to verify types are correctly defined
    const message: UnifiedMessage = {
      id: 'test',
      threadId: 'thread',
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: '+1',
      recipientIdentifier: '+2',
      text: 'Test',
      timestamp: new Date(),
      status: 'sent',
    };

    const channelMessage: ChannelMessage = message;
    expect(channelMessage).toBeDefined();

    const result: ChannelMessageResult = {
      channelMessageId: 'result-123',
      status: 'sent',
      timestamp: new Date(),
    };
    expect(result).toBeDefined();

    const status: MessageStatus = 'delivered';
    expect(status).toBeDefined();

    const channelType: ChannelType = 'email';
    expect(channelType).toBeDefined();

    const direction: MessageDirection = 'outgoing';
    expect(direction).toBeDefined();
  });
});
