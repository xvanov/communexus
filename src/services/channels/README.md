# Channel Adapter Pattern

This directory contains the channel adapter implementation for the Communexus multi-channel messaging system. The adapter pattern enables clean integration of new communication channels (SMS, Messenger, Email, etc.) without modifying core messaging logic.

## Overview

The channel adapter pattern provides a standardized interface (`ChannelAdapter`) that all channel implementations must follow. This allows:

- **Clean separation of concerns**: Channel-specific logic is isolated in adapter implementations
- **Extensibility**: New channels can be added without modifying core messaging logic
- **Unified message format**: All messages are normalized to `UnifiedMessage` format
- **Consistent API**: All channels provide the same interface for sending, receiving, and status checking

## Architecture

### Channel Adapter Interface

The `ChannelAdapter` interface defines the contract that all channel implementations must follow:

```typescript
interface ChannelAdapter {
  id: string;
  type: 'sms' | 'messenger' | 'email' | 'in-app';
  
  send(message: ChannelMessage): Promise<ChannelMessageResult>;
  receive(webhookPayload: any): UnifiedMessage;
  getStatus(messageId: string): Promise<MessageStatus>;
}
```

### Unified Message Format

All messages from different channels are normalized to the `UnifiedMessage` format:

```typescript
interface UnifiedMessage {
  id: string;
  threadId: string;
  channel: 'sms' | 'messenger' | 'email' | 'in-app';
  direction: 'incoming' | 'outgoing';
  senderIdentifier: string;
  recipientIdentifier: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    channelSpecific?: any;
  };
}
```

## Usage Examples

### Implementing a Channel Adapter

To create a new channel adapter, implement the `ChannelAdapter` interface:

```typescript
import { ChannelAdapter } from './adapter';
import { UnifiedMessage, ChannelMessage, ChannelMessageResult, MessageStatus } from '../../types/Channel';

class TwilioSMSAdapter implements ChannelAdapter {
  id = 'twilio-sms';
  type = 'sms' as const;

  async send(message: ChannelMessage): Promise<ChannelMessageResult> {
    // Convert UnifiedMessage to Twilio format
    const twilioMessage = {
      to: message.recipientIdentifier,
      from: this.twilioPhoneNumber,
      body: message.text,
    };

    // Call Twilio API
    const result = await this.twilioClient.messages.create(twilioMessage);

    // Return normalized result
    return {
      channelMessageId: result.sid,
      status: 'sent',
      timestamp: new Date(),
    };
  }

  receive(webhookPayload: any): UnifiedMessage {
    // Convert Twilio webhook to UnifiedMessage
    return {
      id: webhookPayload.MessageSid,
      threadId: '', // Will be determined by routing logic
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: webhookPayload.From,
      recipientIdentifier: webhookPayload.To,
      text: webhookPayload.Body,
      timestamp: new Date(webhookPayload.Timestamp * 1000),
      status: 'delivered',
      metadata: {
        channelSpecific: {
          twilioMessageSid: webhookPayload.MessageSid,
          twilioAccountSid: webhookPayload.AccountSid,
        },
      },
    };
  }

  async getStatus(messageId: string): Promise<MessageStatus> {
    // Query Twilio API for message status
    const message = await this.twilioClient.messages(messageId).fetch();
    
    // Map Twilio status to UnifiedMessage status
    const statusMap: Record<string, MessageStatus> = {
      queued: 'sending',
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    };

    return statusMap[message.status] || 'failed';
  }
}
```

### Using a Channel Adapter

```typescript
import { ChannelAdapter } from '@/services/channels';
import { UnifiedMessage } from '@/types';

// Create adapter instance
const smsAdapter: ChannelAdapter = new TwilioSMSAdapter();

// Send a message
const message: UnifiedMessage = {
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

const result = await smsAdapter.send(message);
console.log(`Message sent: ${result.channelMessageId}`);

// Receive a webhook
const webhookPayload = {
  MessageSid: 'SM1234567890abcdef',
  From: '+15551234567',
  To: '+15559876543',
  Body: 'Hello back',
  Timestamp: 1234567890,
};

const unifiedMessage = smsAdapter.receive(webhookPayload);
console.log(`Received message: ${unifiedMessage.text}`);

// Check message status
const status = await smsAdapter.getStatus(result.channelMessageId);
console.log(`Message status: ${status}`);
```

## Channel Types

### SMS (Twilio)
- **Channel Type**: `'sms'`
- **Identifier Format**: Phone numbers (e.g., `'+15551234567'`)
- **Adapter**: `TwilioSMSAdapter` (to be implemented in Story 1.2)

### Facebook Messenger
- **Channel Type**: `'messenger'`
- **Identifier Format**: Facebook Page-Scoped IDs (PSID)
- **Adapter**: `FacebookMessengerAdapter` (to be implemented in Story 2.2)

### Email (SendGrid)
- **Channel Type**: `'email'`
- **Identifier Format**: Email addresses (e.g., `'user@example.com'`)
- **Adapter**: `SendGridEmailAdapter` (to be implemented in Story 2.5)

### In-App
- **Channel Type**: `'in-app'`
- **Identifier Format**: User IDs (e.g., `'user-123'`)
- **Adapter**: `InAppAdapter` (existing in-app messaging treated as channel)

## Integration with Core Messaging

Channel adapters integrate with the core messaging system through:

1. **Message Routing**: Incoming messages are received via webhooks, converted to `UnifiedMessage` format, and routed to the correct thread
2. **Message Sending**: Outgoing messages are sent through the appropriate channel adapter based on thread channel configuration
3. **Status Tracking**: Message status is tracked through the `getStatus()` method for delivery and read receipts

## File Structure

```
src/services/channels/
├── adapter.ts          # ChannelAdapter interface definition
├── index.ts            # Barrel export for channel services
├── README.md           # This file
└── __tests__/
    └── adapter.test.ts # Unit tests for adapter interface
```

## Testing

Unit tests verify that:
- Channel adapters correctly implement the `ChannelAdapter` interface
- UnifiedMessage type structure is correctly defined
- Type exports are accessible from barrel exports

See `__tests__/adapter.test.ts` for test examples.

## Future Extensions

The adapter pattern supports future channel additions:
- WhatsApp (deferred)
- Roomies.com integration (optional)
- Custom channel integrations via connector interface

## Related Documentation

- [Architecture Document](../../../../docs/architecture.md#Channel-Adapter-Interface)
- [Story 1.1: Channel Abstraction Interface Design](../../../../docs/stories/1-1-channel-abstraction-interface-design.md)
- [API Contracts](../../../../docs/architecture.md#API-Contracts)








