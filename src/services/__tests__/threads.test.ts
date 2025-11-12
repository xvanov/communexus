/**
 * Unit Tests for Thread Service - Channel Sources Management
 *
 * These tests verify that:
 * - createThread() initializes channelSources array
 * - addChannelSource() adds channels to thread
 * - getChannelSources() returns channel sources
 * - updateChannelSourcesForMessage() automatically updates channelSources
 * - All thread queries include channelSources field
 */

import {
  createThread,
  getThread,
  addChannelSource,
  getChannelSources,
  updateChannelSourcesForMessage,
} from '../threads';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase';

// Mock Firestore
jest.mock('firebase/firestore');
jest.mock('../firebase');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockArrayUnion = arrayUnion as jest.MockedFunction<typeof arrayUnion>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<
  typeof serverTimestamp
>;

describe('Thread Service - Channel Sources Management', () => {
  let mockDb: any;
  let mockCollectionRef: any;
  let mockDocRef: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {};
    mockCollectionRef = {};
    mockDocRef = { id: 'thread-123' };

    mockGetDb.mockResolvedValue(mockDb);
    mockCollection.mockReturnValue(mockCollectionRef);
    mockDoc.mockReturnValue(mockDocRef);
    mockServerTimestamp.mockReturnValue({} as any);
  });

  describe('createThread', () => {
    it('should initialize channelSources as empty array', async () => {
      // Mock getDocs to return empty snapshot (no existing thread found)
      mockGetDocs.mockResolvedValue({
        docs: [],
      } as any);
      mockAddDoc.mockResolvedValue(mockDocRef);

      await createThread(
        ['user1', 'user2'],
        [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
        false
      );

      expect(mockAddDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({
          channelSources: [],
        })
      );
    });
  });

  describe('getThread', () => {
    it('should include channelSources in returned thread', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: 'thread-123',
        data: () => ({
          participants: ['user1', 'user2'],
          participantDetails: [],
          isGroup: false,
          unreadCount: {},
          channelSources: ['sms', 'messenger'],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);

      const result = await getThread('thread-123');

      expect(result).toBeDefined();
      expect(result?.channelSources).toEqual(['sms', 'messenger']);
    });

    it('should default channelSources to empty array if missing', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: 'thread-123',
        data: () => ({
          participants: ['user1', 'user2'],
          participantDetails: [],
          isGroup: false,
          unreadCount: {},
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);

      const result = await getThread('thread-123');

      expect(result?.channelSources).toEqual([]);
    });
  });

  describe('addChannelSource', () => {
    it('should add channel to thread using arrayUnion', async () => {
      mockArrayUnion.mockReturnValue('sms' as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await addChannelSource('thread-123', 'sms');

      expect(mockDoc).toHaveBeenCalledWith(mockDb, 'threads', 'thread-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          channelSources: expect.anything(),
        })
      );
    });
  });

  describe('getChannelSources', () => {
    it('should return channel sources for thread', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: 'thread-123',
        data: () => ({
          participants: ['user1', 'user2'],
          participantDetails: [],
          isGroup: false,
          unreadCount: {},
          channelSources: ['sms', 'messenger', 'email'],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);

      const result = await getChannelSources('thread-123');

      expect(result).toEqual(['sms', 'messenger', 'email']);
    });

    it('should return empty array if thread does not exist', async () => {
      const mockSnapshot = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);

      const result = await getChannelSources('thread-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateChannelSourcesForMessage', () => {
    it('should add channel if not already in array', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: 'thread-123',
        data: () => ({
          participants: ['user1', 'user2'],
          participantDetails: [],
          isGroup: false,
          unreadCount: {},
          channelSources: ['sms'],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);
      mockArrayUnion.mockReturnValue('messenger' as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateChannelSourcesForMessage('thread-123', 'messenger');

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should not add channel if already in array', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: 'thread-123',
        data: () => ({
          participants: ['user1', 'user2'],
          participantDetails: [],
          isGroup: false,
          unreadCount: {},
          channelSources: ['sms', 'messenger'],
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateChannelSourcesForMessage('thread-123', 'sms');

      // Should not call updateDoc since channel already exists
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should throw error if thread does not exist', async () => {
      const mockSnapshot = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockSnapshot as any);

      await expect(
        updateChannelSourcesForMessage('thread-123', 'sms')
      ).rejects.toThrow('Thread not found');
    });
  });
});

