/**
 * Unit Tests for Routing Service
 *
 * These tests verify that:
 * - RoutingService correctly routes messages using multi-strategy approach
 * - Identity-based routing finds threads by participant identity
 * - Metadata-based routing finds threads by property/project ID
 * - Context-based routing scores threads by keyword matches
 * - Routing decision logging works correctly
 * - Manual assignment fallback stores unassigned messages
 * - Thread creation works for new conversations
 * - Edge cases are handled gracefully
 */

import { RoutingService } from '../routing';
import { IdentityService } from '../identity';
import { createThread, listThreadsForUser, addChannelSource } from '../threads';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { UnifiedMessage } from '../../types/Channel';
import type { Thread } from '../../types/Thread';

// Mock dependencies
jest.mock('../identity');
jest.mock('../threads');
jest.mock('firebase/firestore');
jest.mock('../firebase');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

const mockIdentityService = IdentityService as jest.MockedClass<typeof IdentityService>;
const mockCreateThread = createThread as jest.MockedFunction<typeof createThread>;
const mockListThreadsForUser = listThreadsForUser as jest.MockedFunction<typeof listThreadsForUser>;
const mockAddChannelSource = addChannelSource as jest.MockedFunction<typeof addChannelSource>;

describe('RoutingService', () => {
  let routingService: RoutingService;
  let mockDb: any;
  let mockCollectionRef: any;
  let mockDocRef: any;
  let mockQuerySnapshot: any;
  let mockIdentityServiceInstance: jest.Mocked<IdentityService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Firestore database
    mockDb = {};
    mockGetDb.mockResolvedValue(mockDb as any);

    // Setup mock collection
    mockCollectionRef = {};
    mockCollection.mockReturnValue(mockCollectionRef as any);

    // Setup mock document reference
    mockDocRef = { id: 'test-doc-id' };
    mockDoc.mockReturnValue(mockDocRef as any);

    // Setup mock query snapshot
    mockQuerySnapshot = {
      docs: [],
    };
    mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

    // Setup mock IdentityService instance
    mockIdentityServiceInstance = {
      lookupByIdentifier: jest.fn(),
      addExternalIdentity: jest.fn(),
    } as any;
    mockIdentityService.mockImplementation(() => mockIdentityServiceInstance);

    // Setup mock server timestamp
    mockServerTimestamp.mockReturnValue(Timestamp.now() as any);

    // Create service instance
    routingService = new RoutingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('routeByIdentity', () => {
    const senderIdentifier = '+15551234567';
    const organizationId = 'org-456';
    const userId = 'user-123';

    test('returns thread when identity lookup succeeds and thread exists', async () => {
      // Mock identity lookup
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(userId);

      // Mock thread list
      const mockThread: Thread = {
        id: 'thread-123',
        participants: [userId],
        participantDetails: [{ id: userId, name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };
      mockListThreadsForUser.mockResolvedValue([mockThread]);

      const result = await routingService.routeByIdentity(senderIdentifier, organizationId);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe('thread-123');
      expect(result?.method).toBe('identity');
      expect(result?.confidence).toBeGreaterThan(0);
      expect(mockIdentityServiceInstance.lookupByIdentifier).toHaveBeenCalledWith(
        senderIdentifier,
        organizationId
      );
      expect(mockListThreadsForUser).toHaveBeenCalledWith(userId);
    });

    test('returns null when identity lookup returns null', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(null);

      const result = await routingService.routeByIdentity(senderIdentifier, organizationId);

      expect(result).toBeNull();
      expect(mockListThreadsForUser).not.toHaveBeenCalled();
    });

    test('returns null when no threads found for user', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(userId);
      mockListThreadsForUser.mockResolvedValue([]);

      const result = await routingService.routeByIdentity(senderIdentifier, organizationId);

      expect(result).toBeNull();
    });

    test('returns most recent thread when multiple threads match', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(userId);

      const oldThread: Thread = {
        id: 'thread-old',
        participants: [userId],
        participantDetails: [{ id: userId, name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const recentThread: Thread = {
        id: 'thread-recent',
        participants: [userId],
        participantDetails: [{ id: userId, name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      };

      mockListThreadsForUser.mockResolvedValue([recentThread, oldThread]); // Already sorted by updatedAt desc

      const result = await routingService.routeByIdentity(senderIdentifier, organizationId);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe('thread-recent'); // Most recent thread
    });

    test('handles errors gracefully', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockRejectedValue(
        new Error('Identity lookup failed')
      );

      await expect(
        routingService.routeByIdentity(senderIdentifier, organizationId)
      ).rejects.toThrow('Identity lookup failed');
    });
  });

  describe('routeByMetadata', () => {
    const organizationId = 'org-456';
    const propertyId = 'property-123';
    const unifiedMessage: UnifiedMessage = {
      id: 'msg-123',
      threadId: '',
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: '+15551234567',
      recipientIdentifier: '+15559876543',
      text: 'Hello, I am interested in property at 123 Main St',
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        channelSpecific: {
          propertyId,
        },
      },
    };

    test('returns thread when propertyId matches', async () => {
      // Mock query for threads by propertyId
      const mockThread: Thread = {
        id: 'thread-123',
        participants: ['user-1'],
        participantDetails: [{ id: 'user-1', name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuerySnapshot.docs = [
        {
          id: 'thread-123',
          data: () => ({
            participants: ['user-1'],
            participantDetails: [{ id: 'user-1', name: 'Test User' }],
            isGroup: false,
            unreadCount: {},
            channelSources: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
        },
      ];

      mockQuery.mockReturnValue(mockQuerySnapshot as any);
      mockWhere.mockReturnValue(mockQuerySnapshot as any);
      mockOrderBy.mockReturnValue(mockQuerySnapshot as any);
      mockLimit.mockReturnValue(mockQuerySnapshot as any);

      const result = await routingService.routeByMetadata(unifiedMessage, organizationId);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe('thread-123');
      expect(result?.method).toBe('metadata');
      expect(result?.confidence).toBeGreaterThan(0);
    });

    test('returns null when no propertyId or projectId found', async () => {
      const messageWithoutMetadata: UnifiedMessage = {
        ...unifiedMessage,
        metadata: undefined,
        text: 'Hello',
      };

      const result = await routingService.routeByMetadata(messageWithoutMetadata, organizationId);

      expect(result).toBeNull();
    });

    test('returns null when no threads match', async () => {
      mockQuerySnapshot.docs = [];
      mockQuery.mockReturnValue(mockQuerySnapshot as any);

      const result = await routingService.routeByMetadata(unifiedMessage, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('routeByContext', () => {
    const organizationId = 'org-456';
    const unifiedMessage: UnifiedMessage = {
      id: 'msg-123',
      threadId: '',
      channel: 'sms',
      direction: 'incoming',
      senderIdentifier: '+15551234567',
      recipientIdentifier: '+15559876543',
      text: 'Hello, I need help with maintenance request',
      timestamp: new Date(),
      status: 'delivered',
    };

    test('returns thread when keyword matches found', async () => {
      // Mock query for recent threads
      const mockThread: Thread = {
        id: 'thread-123',
        participants: ['user-1'],
        participantDetails: [{ id: 'user-1', name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: {
          text: 'I need help with maintenance request',
          senderId: 'user-1',
          senderName: 'Test User',
          timestamp: new Date(),
        },
      };

      mockQuerySnapshot.docs = [
        {
          id: 'thread-123',
          data: () => ({
            participants: ['user-1'],
            participantDetails: [{ id: 'user-1', name: 'Test User' }],
            isGroup: false,
            unreadCount: {},
            channelSources: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastMessage: {
              text: 'I need help with maintenance request',
              senderId: 'user-1',
              senderName: 'Test User',
              timestamp: Timestamp.now(),
            },
          }),
        },
      ];

      mockQuery.mockReturnValue(mockQuerySnapshot as any);
      mockOrderBy.mockReturnValue(mockQuerySnapshot as any);
      mockLimit.mockReturnValue(mockQuerySnapshot as any);

      const result = await routingService.routeByContext(unifiedMessage, organizationId);

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe('thread-123');
      expect(result?.method).toBe('context');
      expect(result?.confidence).toBeGreaterThan(0);
    });

    test('returns null when no keywords extracted', async () => {
      const emptyMessage: UnifiedMessage = {
        ...unifiedMessage,
        text: '   ',
      };

      const result = await routingService.routeByContext(emptyMessage, organizationId);

      expect(result).toBeNull();
    });

    test('returns null when no threads match threshold', async () => {
      mockQuerySnapshot.docs = [
        {
          id: 'thread-123',
          data: () => ({
            participants: ['user-1'],
            participantDetails: [{ id: 'user-1', name: 'Test User' }],
            isGroup: false,
            unreadCount: {},
            channelSources: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastMessage: {
              text: 'Different topic',
              senderId: 'user-1',
              senderName: 'Test User',
              timestamp: Timestamp.now(),
            },
          }),
        },
      ];

      mockQuery.mockReturnValue(mockQuerySnapshot as any);

      const result = await routingService.routeByContext(unifiedMessage, organizationId);

      // Should return null if score is below threshold
      expect(result).toBeNull();
    });
  });

  describe('routeMessage', () => {
    const organizationId = 'org-456';
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

    test('returns identity-based routing result when available', async () => {
      const userId = 'user-123';
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(userId);

      const mockThread: Thread = {
        id: 'thread-123',
        participants: [userId],
        participantDetails: [{ id: userId, name: 'Test User' }],
        isGroup: false,
        unreadCount: {},
        channelSources: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockListThreadsForUser.mockResolvedValue([mockThread]);

      // Mock routing logs collection
      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      expect(result).not.toBeNull();
      expect(result?.method).toBe('identity');
      expect(mockIdentityServiceInstance.lookupByIdentifier).toHaveBeenCalled();
    });

    test('falls back to metadata-based routing when identity fails', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(null);

      const unifiedMessageWithMetadata: UnifiedMessage = {
        ...unifiedMessage,
        metadata: {
          channelSpecific: {
            propertyId: 'property-123',
          },
        },
      };

      mockQuerySnapshot.docs = [
        {
          id: 'thread-123',
          data: () => ({
            participants: ['user-1'],
            participantDetails: [{ id: 'user-1', name: 'Test User' }],
            isGroup: false,
            unreadCount: {},
            channelSources: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
        },
      ];

      mockQuery.mockReturnValue(mockQuerySnapshot as any);
      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      const result = await routingService.routeMessage(
        unifiedMessageWithMetadata,
        organizationId
      );

      expect(result).not.toBeNull();
      expect(result?.method).toBe('metadata');
    });

    test('returns null when all strategies fail', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(null);

      mockQuerySnapshot.docs = [];
      mockQuery.mockReturnValue(mockQuerySnapshot as any);

      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      const result = await routingService.routeMessage(unifiedMessage, organizationId);

      expect(result).toBeNull();
      // Should still log the routing decision
      expect(mockAddDoc).toHaveBeenCalled();
    });

    test('validates required inputs', async () => {
      await expect(
        routingService.routeMessage(null as any, organizationId)
      ).rejects.toThrow('UnifiedMessage is required');

      await expect(
        routingService.routeMessage(unifiedMessage, '')
      ).rejects.toThrow('organizationId is required');
    });
  });

  describe('createThreadForMessage', () => {
    const organizationId = 'org-456';
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

    test('creates thread when user exists', async () => {
      const userId = 'user-123';
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(userId);
      mockCreateThread.mockResolvedValue('thread-123');
      mockAddChannelSource.mockResolvedValue(undefined);

      const result = await routingService.createThreadForMessage(unifiedMessage, organizationId);

      expect(result).toBe('thread-123');
      expect(mockCreateThread).toHaveBeenCalled();
      expect(mockAddChannelSource).toHaveBeenCalledWith('thread-123', 'sms');
    });

    test('creates identity link and thread when user does not exist', async () => {
      mockIdentityServiceInstance.lookupByIdentifier.mockResolvedValue(null);
      mockIdentityServiceInstance.addExternalIdentity.mockResolvedValue({
        id: 'identity-link-123',
        userId: 'external-user-1234567890-abc',
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: unifiedMessage.senderIdentifier,
            verified: false,
          },
        ],
        createdAt: new Date(),
      } as any);
      mockCreateThread.mockResolvedValue('thread-123');
      mockAddChannelSource.mockResolvedValue(undefined);

      const result = await routingService.createThreadForMessage(unifiedMessage, organizationId);

      expect(result).toBe('thread-123');
      expect(mockIdentityServiceInstance.addExternalIdentity).toHaveBeenCalled();
      expect(mockCreateThread).toHaveBeenCalled();
    });

    test('validates required inputs', async () => {
      await expect(
        routingService.createThreadForMessage(null as any, organizationId)
      ).rejects.toThrow('UnifiedMessage is required');

      await expect(
        routingService.createThreadForMessage(unifiedMessage, '')
      ).rejects.toThrow('organizationId is required');

      const messageWithoutSender = { ...unifiedMessage, senderIdentifier: '' };
      await expect(
        routingService.createThreadForMessage(messageWithoutSender, organizationId)
      ).rejects.toThrow('senderIdentifier is required');
    });
  });

  describe('createUnassignedMessage', () => {
    const organizationId = 'org-456';
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

    test('stores unassigned message in pending_routing collection', async () => {
      mockAddDoc.mockResolvedValue({ id: 'pending-123' } as any);

      const result = await routingService.createUnassignedMessage(unifiedMessage, organizationId);

      expect(result).toBe('pending-123');
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pending_routing');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    test('handles errors gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        routingService.createUnassignedMessage(unifiedMessage, organizationId)
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('assignUnassignedMessage', () => {
    const pendingMessageId = 'pending-123';
    const threadId = 'thread-123';
    const assignedBy = 'user-123';

    test('assigns pending message to thread', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await routingService.assignUnassignedMessage(pendingMessageId, threadId, assignedBy);

      expect(mockDoc).toHaveBeenCalledWith(mockDb, 'pending_routing', pendingMessageId);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    test('handles errors gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        routingService.assignUnassignedMessage(pendingMessageId, threadId)
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('logRoutingDecision', () => {
    const decision = {
      messageId: 'msg-123',
      senderIdentifier: '+15551234567',
      channel: 'sms' as const,
      timestamp: new Date(),
      method: 'identity' as const,
      confidence: 0.9,
      reason: 'Matched by participant identity',
      threadId: 'thread-123',
      organizationId: 'org-456',
    };

    test('logs routing decision to routing_logs collection', async () => {
      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      await routingService.logRoutingDecision(decision);

      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'routing_logs');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    test('does not throw on logging errors', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      // Should not throw - logging failures shouldn't break routing
      await expect(routingService.logRoutingDecision(decision)).resolves.not.toThrow();
    });
  });
});








