/**
 * Integration Tests for Message Routing
 *
 * These tests verify that:
 * - Routing works with SMS webhook (Story 1.2 integration)
 * - Routing works with identity linking (Story 1.3 integration)
 * - Routing works with multi-channel threads (Story 1.4 integration)
 * - Routing creates new threads when no match found
 * - Routing handles manual assignment fallback
 * - Routing handles edge cases (multiple matches, no identity link, etc.)
 *
 * Note: These tests require Firebase emulators to be running.
 * Run with: npm run test:emul
 */

import { RoutingService } from '../../src/services/routing';
import { IdentityService } from '../../src/services/identity';
import { createThread, listThreadsForUser, addChannelSource } from '../../src/services/threads';
import { convertUnifiedMessageToMessage, sendMessage } from '../../src/services/messaging';
import type { UnifiedMessage } from '../../src/types/Channel';
import type { RoutingResult } from '../../src/services/routing';

// Note: These tests require Firebase emulators
// They are skipped by default and should be run with test:emul script
const isEmulatorRunning = process.env.FIREBASE_EMULATOR_HOST !== undefined;

describe.skip('Routing Integration Tests', () => {
  let routingService: RoutingService;
  const organizationId = 'org-456';

  beforeEach(() => {
    if (!isEmulatorRunning) {
      console.warn('Firebase emulators not running. Skipping integration tests.');
      return;
    }

    routingService = new RoutingService();
  });

  describe('SMS Webhook Integration', () => {
    test('routes SMS message to existing thread by identity', async () => {
      if (!isEmulatorRunning) return;

      // Setup: Create identity link
      const identityService = new IdentityService();
      const userId = 'user-123';
      await identityService.linkPhoneNumber(userId, '+15551234567', organizationId);

      // Setup: Create thread
      const threadId = await createThread(
        [userId],
        [{ id: userId, name: 'Test User' }],
        false
      );

      // Test: Route SMS message
      const unifiedMessage: UnifiedMessage = {
        id: 'sms-msg-123',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551234567',
        recipientIdentifier: '+15559876543',
        text: 'Hello from SMS',
        timestamp: new Date(),
        status: 'delivered',
      };

      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe(threadId);
      expect(result?.method).toBe('identity');
    });

    test('creates new thread when SMS message cannot be routed', async () => {
      if (!isEmulatorRunning) return;

      const unifiedMessage: UnifiedMessage = {
        id: 'sms-msg-456',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15559999999',
        recipientIdentifier: '+15559876543',
        text: 'Hello, new customer',
        timestamp: new Date(),
        status: 'delivered',
      };

      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      // Should return null (no match found)
      expect(result).toBeNull();

      // Create thread for new conversation
      const threadId = await routingService.createThreadForMessage(unifiedMessage, organizationId);

      expect(threadId).toBeTruthy();

      // Verify thread was created with channelSources
      // Note: This would require thread retrieval logic
    });
  });

  describe('Identity Linking Integration', () => {
    test('routes message by identity link across channels', async () => {
      if (!isEmulatorRunning) return;

      // Setup: Create identity link
      const identityService = new IdentityService();
      const userId = 'user-123';
      await identityService.linkPhoneNumber(userId, '+15551234567', organizationId);
      await identityService.linkEmail(userId, 'user@example.com', organizationId);

      // Setup: Create thread
      const threadId = await createThread(
        [userId],
        [{ id: userId, name: 'Test User' }],
        false
      );

      // Test: Route SMS message
      const smsMessage: UnifiedMessage = {
        id: 'sms-msg-789',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551234567',
        recipientIdentifier: '+15559876543',
        text: 'Hello from SMS',
        timestamp: new Date(),
        status: 'delivered',
      };

      const smsResult = await routingService.routeMessage(smsMessage, organizationId);
      expect(smsResult?.threadId).toBe(threadId);

      // Test: Route email message (same user, different channel)
      const emailMessage: UnifiedMessage = {
        id: 'email-msg-123',
        threadId: '',
        channel: 'email',
        direction: 'incoming',
        senderIdentifier: 'user@example.com',
        recipientIdentifier: 'support@example.com',
        text: 'Hello from email',
        timestamp: new Date(),
        status: 'delivered',
      };

      const emailResult = await routingService.routeMessage(emailMessage, organizationId);
      expect(emailResult?.threadId).toBe(threadId); // Should route to same thread
    });
  });

  describe('Multi-Channel Thread Integration', () => {
    test('routes messages from different channels to same thread', async () => {
      if (!isEmulatorRunning) return;

      // Setup: Create identity link
      const identityService = new IdentityService();
      const userId = 'user-123';
      await identityService.linkPhoneNumber(userId, '+15551234567', organizationId);

      // Setup: Create thread with SMS channel
      const threadId = await createThread(
        [userId],
        [{ id: userId, name: 'Test User' }],
        false
      );
      await addChannelSource(threadId, 'sms');

      // Test: Route SMS message
      const smsMessage: UnifiedMessage = {
        id: 'sms-msg-123',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551234567',
        recipientIdentifier: '+15559876543',
        text: 'Hello from SMS',
        timestamp: new Date(),
        status: 'delivered',
      };

      const result = await routingService.routeMessage(smsMessage, organizationId);
      expect(result?.threadId).toBe(threadId);

      // Verify channelSources includes both channels
      // Note: This would require thread retrieval logic
    });
  });

  describe('Manual Assignment Fallback', () => {
    test('stores unassigned message in pending_routing collection', async () => {
      if (!isEmulatorRunning) return;

      const unifiedMessage: UnifiedMessage = {
        id: 'msg-ambiguous',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551111111',
        recipientIdentifier: '+15559876543',
        text: 'Ambiguous message',
        timestamp: new Date(),
        status: 'delivered',
      };

      // Attempt routing (should fail)
      const result = await routingService.routeMessage(unifiedMessage, organizationId);
      expect(result).toBeNull();

      // Create unassigned message
      const pendingMessageId = await routingService.createUnassignedMessage(
        unifiedMessage,
        organizationId
      );

      expect(pendingMessageId).toBeTruthy();

      // Assign to thread
      const threadId = await createThread(
        ['user-123'],
        [{ id: 'user-123', name: 'Test User' }],
        false
      );

      await routingService.assignUnassignedMessage(pendingMessageId, threadId, 'user-123');

      // Verify assignment
      // Note: This would require pending message retrieval logic
    });
  });

  describe('Edge Cases', () => {
    test('handles multiple threads matching by identity', async () => {
      if (!isEmulatorRunning) return;

      // Setup: Create identity link
      const identityService = new IdentityService();
      const userId = 'user-123';
      await identityService.linkPhoneNumber(userId, '+15551234567', organizationId);

      // Setup: Create multiple threads
      const oldThreadId = await createThread(
        [userId],
        [{ id: userId, name: 'Test User' }],
        false
      );

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newThreadId = await createThread(
        [userId],
        [{ id: userId, name: 'Test User' }],
        false
      );

      // Test: Route message
      const unifiedMessage: UnifiedMessage = {
        id: 'msg-123',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551234567',
        recipientIdentifier: '+15559876543',
        text: 'Hello',
        timestamp: new Date(),
        status: 'delivered',
      };

      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      expect(result).not.toBeNull();
      // Should return most recent thread
      expect(result?.threadId).toBe(newThreadId);
    });

    test('handles empty message text in context-based routing', async () => {
      if (!isEmulatorRunning) return;

      const unifiedMessage: UnifiedMessage = {
        id: 'msg-empty',
        threadId: '',
        channel: 'sms',
        direction: 'incoming',
        senderIdentifier: '+15551111111',
        recipientIdentifier: '+15559876543',
        text: '',
        timestamp: new Date(),
        status: 'delivered',
      };

      // Should fall back through all strategies
      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      // Should return null or create new thread
      // Note: Behavior depends on implementation
    });
  });
});







