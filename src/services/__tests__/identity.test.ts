/**
 * Unit Tests for Identity Service
 *
 * These tests verify that:
 * - IdentityService methods correctly link external identities to users
 * - Identity lookup by external identifier returns correct user ID
 * - Multiple external identities can be linked to same user
 * - Identity verification updates verification status
 * - Duplicate external identities are prevented
 * - Validation for phone numbers (E.164), emails, Facebook IDs
 */

import { IdentityService } from '../identity';
import {
  IdentityLink,
  ExternalIdentity,
  ExternalIdentityType,
} from '../../types/Identity';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../firebase';

// Mock Firestore
jest.mock('firebase/firestore');
jest.mock('../firebase');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;

describe('IdentityService', () => {
  let identityService: IdentityService;
  let mockDb: any;
  let mockCollectionRef: any;
  let mockDocRef: any;
  let mockQuerySnapshot: any;

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

    // Create service instance
    identityService = new IdentityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('linkPhoneNumber', () => {
    const userId = 'user-123';
    const phoneNumber = '+15551234567';
    const organizationId = 'org-456';

    test('creates new identity link when none exists', async () => {
      // Mock document doesn't exist
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      // Mock setDoc success
      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.linkPhoneNumber(
        userId,
        phoneNumber,
        organizationId
      );

      // Verify Firestore operations
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'identityLinks');
      expect(mockSetDoc).toHaveBeenCalled();

      // Verify result
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.externalIdentities).toHaveLength(1);
      expect(result.externalIdentities[0].type).toBe('phone');
      expect(result.externalIdentities[0].value).toBe(phoneNumber);
      expect(result.externalIdentities[0].verified).toBe(false);
    });

    test('adds phone number to existing identity link', async () => {
      const existingIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          {
            type: 'email',
            value: 'user@example.com',
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      // Mock document exists
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: existingIdentityLink.id,
          userId: existingIdentityLink.userId,
          organizationId: existingIdentityLink.organizationId,
          externalIdentities: existingIdentityLink.externalIdentities.map(
            identity => ({
              type: identity.type,
              value: identity.value,
              verified: identity.verified,
            })
          ),
          createdAt: Timestamp.fromDate(existingIdentityLink.createdAt),
        }),
        id: existingIdentityLink.id,
      } as any);

      // Mock setDoc success
      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.linkPhoneNumber(
        userId,
        phoneNumber,
        organizationId
      );

      // Verify result includes both identities
      expect(result.externalIdentities).toHaveLength(2);
      expect(
        result.externalIdentities.find(id => id.type === 'phone')
      ).toBeDefined();
      expect(
        result.externalIdentities.find(id => id.type === 'email')
      ).toBeDefined();
    });

    test('throws error for invalid phone number format', async () => {
      const invalidPhoneNumber = 'invalid-phone';

      await expect(
        identityService.linkPhoneNumber(
          userId,
          invalidPhoneNumber,
          organizationId
        )
      ).rejects.toThrow('Invalid phone number format');
    });

    test('updates existing phone number if already linked', async () => {
      const existingIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: phoneNumber,
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      // Mock document exists
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: existingIdentityLink.id,
          userId: existingIdentityLink.userId,
          organizationId: existingIdentityLink.organizationId,
          externalIdentities: existingIdentityLink.externalIdentities.map(
            identity => ({
              type: identity.type,
              value: identity.value,
              verified: identity.verified,
            })
          ),
          createdAt: Timestamp.fromDate(existingIdentityLink.createdAt),
        }),
        id: existingIdentityLink.id,
      } as any);

      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.linkPhoneNumber(
        userId,
        phoneNumber,
        organizationId
      );

      // Verify phone number is still only once in the list
      const phoneIdentities = result.externalIdentities.filter(
        id => id.type === 'phone' && id.value === phoneNumber
      );
      expect(phoneIdentities).toHaveLength(1);
    });
  });

  describe('linkEmail', () => {
    const userId = 'user-123';
    const email = 'user@example.com';
    const organizationId = 'org-456';

    test('creates new identity link with email', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.linkEmail(
        userId,
        email,
        organizationId
      );

      expect(result).toBeDefined();
      expect(result.externalIdentities).toHaveLength(1);
      expect(result.externalIdentities[0].type).toBe('email');
      expect(result.externalIdentities[0].value).toBe(email.toLowerCase());
      expect(result.externalIdentities[0].verified).toBe(false);
    });

    test('throws error for invalid email format', async () => {
      const invalidEmail = 'invalid-email';

      await expect(
        identityService.linkEmail(userId, invalidEmail, organizationId)
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('linkFacebookId', () => {
    const userId = 'user-123';
    const facebookId = '1234567890';
    const organizationId = 'org-456';

    test('creates new identity link with Facebook ID', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.linkFacebookId(
        userId,
        facebookId,
        organizationId
      );

      expect(result).toBeDefined();
      expect(result.externalIdentities).toHaveLength(1);
      expect(result.externalIdentities[0].type).toBe('facebook_id');
      expect(result.externalIdentities[0].value).toBe(facebookId);
      expect(result.externalIdentities[0].verified).toBe(false);
    });
  });

  describe('lookupByIdentifier', () => {
    const organizationId = 'org-456';
    const phoneNumber = '+15551234567';
    const userId = 'user-123';

    test('returns user ID when identity link found', async () => {
      const identityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: phoneNumber,
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      // Mock query
      const mockQueryResult = {
        where: jest.fn().mockReturnThis(),
      };
      mockQuery.mockReturnValue(mockQueryResult as any);
      mockWhere.mockReturnValue(mockQueryResult as any);

      // Mock query snapshot
      mockQuerySnapshot.docs = [
        {
          data: () => ({
            id: identityLink.id,
            userId: identityLink.userId,
            organizationId: identityLink.organizationId,
            externalIdentities: identityLink.externalIdentities.map(
              identity => ({
                type: identity.type,
                value: identity.value,
                verified: identity.verified,
              })
            ),
            createdAt: Timestamp.fromDate(identityLink.createdAt),
          }),
          id: identityLink.id,
        },
      ];

      const result = await identityService.lookupByIdentifier(
        phoneNumber,
        organizationId
      );

      expect(result).toBe(userId);
    });

    test('returns null when identity link not found', async () => {
      // Mock query with empty results
      const mockQueryResult = {
        where: jest.fn().mockReturnThis(),
      };
      mockQuery.mockReturnValue(mockQueryResult as any);
      mockWhere.mockReturnValue(mockQueryResult as any);
      mockQuerySnapshot.docs = [];

      const result = await identityService.lookupByIdentifier(
        phoneNumber,
        organizationId
      );

      expect(result).toBeNull();
    });

    test('handles multiple matches by returning first match', async () => {
      const identityLink1: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: phoneNumber,
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      const identityLink2: IdentityLink = {
        id: 'org-456-user-456',
        userId: 'user-456',
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: phoneNumber,
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      // Mock query with multiple matches
      const mockQueryResult = {
        where: jest.fn().mockReturnThis(),
      };
      mockQuery.mockReturnValue(mockQueryResult as any);
      mockWhere.mockReturnValue(mockQueryResult as any);

      mockQuerySnapshot.docs = [
        {
          data: () => ({
            id: identityLink1.id,
            userId: identityLink1.userId,
            organizationId: identityLink1.organizationId,
            externalIdentities: identityLink1.externalIdentities.map(
              identity => ({
                type: identity.type,
                value: identity.value,
                verified: identity.verified,
              })
            ),
            createdAt: Timestamp.fromDate(identityLink1.createdAt),
          }),
          id: identityLink1.id,
        },
        {
          data: () => ({
            id: identityLink2.id,
            userId: identityLink2.userId,
            organizationId: identityLink2.organizationId,
            externalIdentities: identityLink2.externalIdentities.map(
              identity => ({
                type: identity.type,
                value: identity.value,
                verified: identity.verified,
              })
            ),
            createdAt: Timestamp.fromDate(identityLink2.createdAt),
          }),
          id: identityLink2.id,
        },
      ];

      const result = await identityService.lookupByIdentifier(
        phoneNumber,
        organizationId
      );

      // Should return first match with warning
      expect(result).toBe('user-123');
    });
  });

  describe('verifyPhoneNumber', () => {
    const phoneNumber = '+15551234567';
    const verificationCode = '123456';
    const organizationId = 'org-456';
    const userId = 'user-123';

    test('updates verification status for phone number', async () => {
      const identityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: phoneNumber,
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      // Mock lookupByIdentifier
      const mockQueryResult = {
        where: jest.fn().mockReturnThis(),
      };
      mockQuery.mockReturnValue(mockQueryResult as any);
      mockWhere.mockReturnValue(mockQueryResult as any);
      mockQuerySnapshot.docs = [
        {
          data: () => ({
            id: identityLink.id,
            userId: identityLink.userId,
            organizationId: identityLink.organizationId,
            externalIdentities: identityLink.externalIdentities.map(
              identity => ({
                type: identity.type,
                value: identity.value,
                verified: identity.verified,
              })
            ),
            createdAt: Timestamp.fromDate(identityLink.createdAt),
          }),
          id: identityLink.id,
        },
      ];

      // Mock getIdentityLink
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: identityLink.id,
          userId: identityLink.userId,
          organizationId: identityLink.organizationId,
          externalIdentities: identityLink.externalIdentities.map(
            identity => ({
              type: identity.type,
              value: identity.value,
              verified: identity.verified,
            })
          ),
          createdAt: Timestamp.fromDate(identityLink.createdAt),
        }),
        id: identityLink.id,
      } as any);

      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.verifyPhoneNumber(
        phoneNumber,
        verificationCode,
        organizationId
      );

      expect(result).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    test('returns false when identity not found', async () => {
      // Mock lookupByIdentifier returns null
      const mockQueryResult = {
        where: jest.fn().mockReturnThis(),
      };
      mockQuery.mockReturnValue(mockQueryResult as any);
      mockWhere.mockReturnValue(mockQueryResult as any);
      mockQuerySnapshot.docs = [];

      const result = await identityService.verifyPhoneNumber(
        phoneNumber,
        verificationCode,
        organizationId
      );

      expect(result).toBe(false);
    });
  });

  describe('getExternalIdentities', () => {
    const userId = 'user-123';
    const organizationId = 'org-456';

    test('returns all external identities for a user', async () => {
      const identityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          {
            type: 'phone',
            value: '+15551234567',
            verified: true,
          },
          {
            type: 'email',
            value: 'user@example.com',
            verified: true,
          },
          {
            type: 'facebook_id',
            value: '1234567890',
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: identityLink.id,
          userId: identityLink.userId,
          organizationId: identityLink.organizationId,
          externalIdentities: identityLink.externalIdentities.map(
            identity => ({
              type: identity.type,
              value: identity.value,
              verified: identity.verified,
            })
          ),
          createdAt: Timestamp.fromDate(identityLink.createdAt),
        }),
        id: identityLink.id,
      } as any);

      const result = await identityService.getExternalIdentities(
        userId,
        organizationId
      );

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('phone');
      expect(result[1].type).toBe('email');
      expect(result[2].type).toBe('facebook_id');
    });

    test('returns empty array when identity link not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await identityService.getExternalIdentities(
        userId,
        organizationId
      );

      expect(result).toEqual([]);
    });
  });

  describe('removeExternalIdentity', () => {
    const userId = 'user-123';
    const organizationId = 'org-456';
    const externalIdentity: ExternalIdentity = {
      type: 'phone',
      value: '+15551234567',
      verified: true,
    };

    test('removes external identity from identity link', async () => {
      const identityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId,
        organizationId,
        externalIdentities: [
          externalIdentity,
          {
            type: 'email',
            value: 'user@example.com',
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: identityLink.id,
          userId: identityLink.userId,
          organizationId: identityLink.organizationId,
          externalIdentities: identityLink.externalIdentities.map(
            identity => ({
              type: identity.type,
              value: identity.value,
              verified: identity.verified,
            })
          ),
          createdAt: Timestamp.fromDate(identityLink.createdAt),
        }),
        id: identityLink.id,
      } as any);

      mockSetDoc.mockResolvedValue(undefined);

      const result = await identityService.removeExternalIdentity(
        userId,
        externalIdentity,
        organizationId
      );

      expect(result).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    test('returns false when identity link not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await identityService.removeExternalIdentity(
        userId,
        externalIdentity,
        organizationId
      );

      expect(result).toBe(false);
    });
  });

  describe('isVerificationExpired', () => {
    test('returns false for unverified identity', () => {
      const identity: ExternalIdentity = {
        type: 'phone',
        value: '+15551234567',
        verified: false,
      };

      const result = identityService.isVerificationExpired(identity);

      expect(result).toBe(false);
    });

    test('returns false for verified identity without expiration', () => {
      const identity: ExternalIdentity = {
        type: 'phone',
        value: '+15551234567',
        verified: true,
        verifiedAt: new Date(),
      };

      const result = identityService.isVerificationExpired(identity);

      expect(result).toBe(false);
    });

    test('returns true for expired verification', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const identity: ExternalIdentity = {
        type: 'phone',
        value: '+15551234567',
        verified: true,
        verifiedAt: pastDate,
        verifiedExpiresAt: pastDate,
      };

      const result = identityService.isVerificationExpired(identity);

      expect(result).toBe(true);
    });

    test('returns false for non-expired verification', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const identity: ExternalIdentity = {
        type: 'phone',
        value: '+15551234567',
        verified: true,
        verifiedAt: new Date(),
        verifiedExpiresAt: futureDate,
      };

      const result = identityService.isVerificationExpired(identity);

      expect(result).toBe(false);
    });
  });
});







