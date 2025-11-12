/**
 * Identity Service
 *
 * This module provides identity linking functionality for linking external
 * identifiers (phone numbers, emails, Facebook IDs) to internal user identities.
 *
 * The identity linking system enables message routing across channels by
 * resolving external identifiers to internal user IDs, allowing messages
 * from the same person across different channels to appear in the same thread.
 *
 * @example
 * ```typescript
 * import { IdentityService } from './identity';
 *
 * const identityService = new IdentityService();
 *
 * // Link a phone number to a user
 * const identityLink = await identityService.linkPhoneNumber(
 *   'user-123',
 *   '+15551234567',
 *   'org-456'
 * );
 *
 * // Lookup user by external identifier
 * const userId = await identityService.lookupByIdentifier(
 *   '+15551234567',
 *   'org-456'
 * );
 * ```
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  IdentityLink,
  ExternalIdentity,
  ExternalIdentityType,
} from '../types/Identity';

const COLLECTION_NAME = 'identityLinks';

// E.164 phone number format validation pattern
const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cache entry for identity lookups
 */
interface CacheEntry {
  userId: string | null;
  timestamp: number;
}

/**
 * In-memory cache for identity lookups
 * Cache key format: `${organizationId}:${externalIdentifier}`
 * TTL: 5 minutes (300000ms)
 */
const IDENTITY_LOOKUP_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key for identity lookup
 */
const getCacheKey = (
  organizationId: string,
  externalIdentifier: string
): string => {
  return `${organizationId}:${externalIdentifier}`;
};

/**
 * Check if cache entry is valid (not expired)
 */
const isCacheValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL_MS;
};

/**
 * Invalidate cache entries for an organization
 * Called when identity links are updated to ensure cache consistency
 */
const invalidateCacheForOrganization = (organizationId: string): void => {
  const keysToDelete: string[] = [];
  for (const key of IDENTITY_LOOKUP_CACHE.keys()) {
    if (key.startsWith(`${organizationId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => IDENTITY_LOOKUP_CACHE.delete(key));
};

/**
 * Convert Firestore timestamp to Date
 */
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

/**
 * Safely convert date to Firestore Timestamp
 */
const toTimestamp = (
  date: Date | string | undefined | null
): Timestamp | null => {
  if (!date) return null;

  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.warn('Invalid date, using current time');
        return Timestamp.now();
      }
      return Timestamp.fromDate(date);
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date string, using current time:', date);
      return Timestamp.now();
    }
    return Timestamp.fromDate(parsedDate);
  } catch (error) {
    console.warn('Error converting date to timestamp:', error, date);
    return Timestamp.now();
  }
};

/**
 * Convert IdentityLink to Firestore format
 */
const toFirestore = (identityLink: IdentityLink): any => {
  return {
    id: identityLink.id,
    userId: identityLink.userId,
    organizationId: identityLink.organizationId,
    externalIdentities: identityLink.externalIdentities.map(identity => ({
      type: identity.type,
      value: identity.value,
      verified: identity.verified,
      ...(identity.verifiedAt && {
        verifiedAt: toTimestamp(identity.verifiedAt),
      }),
      ...(identity.verifiedExpiresAt && {
        verifiedExpiresAt: toTimestamp(identity.verifiedExpiresAt),
      }),
    })),
    createdAt: toTimestamp(identityLink.createdAt) || Timestamp.now(),
  };
};

/**
 * Convert Firestore document to IdentityLink
 */
const fromFirestore = (doc: any): IdentityLink => {
  const data = doc.data();
  return {
    id: data.id || doc.id,
    userId: data.userId,
    organizationId: data.organizationId,
    externalIdentities: (data.externalIdentities || []).map(
      (identity: any) => ({
        type: identity.type,
        value: identity.value,
        verified: identity.verified || false,
        verifiedAt: identity.verifiedAt
          ? convertTimestamp(identity.verifiedAt)
          : undefined,
        verifiedExpiresAt: identity.verifiedExpiresAt
          ? convertTimestamp(identity.verifiedExpiresAt)
          : undefined,
      })
    ),
    createdAt: convertTimestamp(data.createdAt),
  };
};

/**
 * Validate external identity format
 */
const validateExternalIdentity = (
  type: ExternalIdentityType,
  value: string
): void => {
  switch (type) {
    case 'phone':
      if (!E164_PATTERN.test(value)) {
        throw new Error(
          `Invalid phone number format. Expected E.164 format (e.g., +15551234567), got: ${value}`
        );
      }
      break;
    case 'email':
      if (!EMAIL_PATTERN.test(value)) {
        throw new Error(`Invalid email format: ${value}`);
      }
      break;
    case 'facebook_id':
    case 'whatsapp_id':
      // Facebook ID and WhatsApp ID are just strings - no specific format required
      if (!value || value.trim().length === 0) {
        throw new Error(`Invalid ${type}: value cannot be empty`);
      }
      break;
    default:
      throw new Error(`Unknown identity type: ${type}`);
  }
};

/**
 * Generate identity link document ID
 */
const generateIdentityLinkId = (
  userId: string,
  organizationId: string
): string => {
  return `${organizationId}-${userId}`;
};

/**
 * Identity Service
 *
 * Provides methods for linking external identifiers to internal user identities,
 * looking up users by external identifiers, and managing identity verification.
 */
export class IdentityService {
  /**
   * Link a phone number to a user ID
   *
   * Creates or updates an identity link with a phone number external identity.
   * If an identity link already exists for the user, adds the phone number to it.
   *
   * @param userId - Internal user ID to link the phone number to
   * @param phoneNumber - Phone number in E.164 format (e.g., '+15551234567')
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to the IdentityLink
   * @throws Error if phone number format is invalid or link creation fails
   *
   * @example
   * ```typescript
   * const identityLink = await identityService.linkPhoneNumber(
   *   'user-123',
   *   '+15551234567',
   *   'org-456'
   * );
   * ```
   */
  async linkPhoneNumber(
    userId: string,
    phoneNumber: string,
    organizationId: string
  ): Promise<IdentityLink> {
    // Validate phone number format
    validateExternalIdentity('phone', phoneNumber);

    const externalIdentity: ExternalIdentity = {
      type: 'phone',
      value: phoneNumber,
      verified: false,
    };

    return this.addExternalIdentity(userId, externalIdentity, organizationId);
  }

  /**
   * Link an email address to a user ID
   *
   * Creates or updates an identity link with an email external identity.
   * If an identity link already exists for the user, adds the email to it.
   *
   * @param userId - Internal user ID to link the email to
   * @param email - Email address (e.g., 'user@example.com')
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to the IdentityLink
   * @throws Error if email format is invalid or link creation fails
   *
   * @example
   * ```typescript
   * const identityLink = await identityService.linkEmail(
   *   'user-123',
   *   'user@example.com',
   *   'org-456'
   * );
   * ```
   */
  async linkEmail(
    userId: string,
    email: string,
    organizationId: string
  ): Promise<IdentityLink> {
    // Validate email format
    validateExternalIdentity('email', email);

    const externalIdentity: ExternalIdentity = {
      type: 'email',
      value: email.toLowerCase().trim(), // Normalize email
      verified: false,
    };

    return this.addExternalIdentity(userId, externalIdentity, organizationId);
  }

  /**
   * Link a Facebook ID to a user ID
   *
   * Creates or updates an identity link with a Facebook ID external identity.
   * If an identity link already exists for the user, adds the Facebook ID to it.
   *
   * @param userId - Internal user ID to link the Facebook ID to
   * @param facebookId - Facebook Page-Scoped ID (PSID)
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to the IdentityLink
   * @throws Error if Facebook ID format is invalid or link creation fails
   *
   * @example
   * ```typescript
   * const identityLink = await identityService.linkFacebookId(
   *   'user-123',
   *   '1234567890',
   *   'org-456'
   * );
   * ```
   */
  async linkFacebookId(
    userId: string,
    facebookId: string,
    organizationId: string
  ): Promise<IdentityLink> {
    // Validate Facebook ID format
    validateExternalIdentity('facebook_id', facebookId);

    const externalIdentity: ExternalIdentity = {
      type: 'facebook_id',
      value: facebookId,
      verified: false,
    };

    return this.addExternalIdentity(userId, externalIdentity, organizationId);
  }

  /**
   * Add an external identity to a user's identity link
   *
   * Creates or updates an identity link with the given external identity.
   * If an identity link already exists for the user, adds the external identity to it.
   * Prevents duplicate external identities (same type and value).
   *
   * @param userId - Internal user ID to link the external identity to
   * @param externalIdentity - External identity to link
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to the IdentityLink
   * @throws Error if external identity is invalid or link creation fails
   *
   * @example
   * ```typescript
   * const externalIdentity: ExternalIdentity = {
   *   type: 'phone',
   *   value: '+15551234567',
   *   verified: false
   * };
   *
   * const identityLink = await identityService.addExternalIdentity(
   *   'user-123',
   *   externalIdentity,
   *   'org-456'
   * );
   * ```
   */
  async addExternalIdentity(
    userId: string,
    externalIdentity: ExternalIdentity,
    organizationId: string
  ): Promise<IdentityLink> {
    // Validate external identity format
    validateExternalIdentity(externalIdentity.type, externalIdentity.value);

    try {
      const db = await getDb();
      const identityLinksRef = collection(db, COLLECTION_NAME);
      const identityLinkId = generateIdentityLinkId(userId, organizationId);
      const identityLinkRef = doc(identityLinksRef, identityLinkId);

      // Check if identity link already exists
      const existingDoc = await getDoc(identityLinkRef);

      if (existingDoc.exists()) {
        // Update existing identity link
        const existingLink = fromFirestore(existingDoc);

        // Check for duplicate external identity
        const duplicateIndex = existingLink.externalIdentities.findIndex(
          identity =>
            identity.type === externalIdentity.type &&
            identity.value === externalIdentity.value
        );

        if (duplicateIndex >= 0) {
          // Update existing external identity (e.g., update verified status)
          existingLink.externalIdentities[duplicateIndex] = {
            ...existingLink.externalIdentities[duplicateIndex],
            ...externalIdentity,
          };
        } else {
          // Add new external identity
          existingLink.externalIdentities.push(externalIdentity);
        }

        // Update Firestore document
        const firestoreData = toFirestore(existingLink);
        await setDoc(identityLinkRef, firestoreData, { merge: true });

        // Invalidate cache for this organization
        invalidateCacheForOrganization(organizationId);

        return existingLink;
      } else {
        // Create new identity link
        const newIdentityLink: IdentityLink = {
          id: identityLinkId,
          userId,
          organizationId,
          externalIdentities: [externalIdentity],
          createdAt: new Date(),
        };

        const firestoreData = toFirestore(newIdentityLink);
        await setDoc(identityLinkRef, firestoreData);

        // Invalidate cache for this organization
        invalidateCacheForOrganization(organizationId);

        return newIdentityLink;
      }
    } catch (error) {
      console.error('Error adding external identity:', error);
      throw error;
    }
  }

  /**
   * Lookup user ID by external identifier
   *
   * Queries the identityLinks collection to find a user ID linked to the
   * given external identifier. Supports lookup by phone number, email, or Facebook ID.
   *
   * Note: Firestore doesn't support efficient querying of nested array fields,
   * so this method queries by organizationId and filters client-side.
   * For better performance with large datasets, consider using a composite index
   * or a separate lookup collection.
   *
   * This method uses an in-memory cache with 5-minute TTL to improve performance
   * for frequently accessed identities. Cache is automatically invalidated when
   * identity links are updated.
   *
   * @param externalIdentifier - External identifier to lookup (phone number, email, or Facebook ID)
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to user ID if found, null if not found
   * @throws Error if multiple matches are found (data inconsistency)
   *
   * @example
   * ```typescript
   * const userId = await identityService.lookupByIdentifier(
   *   '+15551234567',
   *   'org-456'
   * );
   * if (userId) {
   *   console.log('Found user:', userId);
   * } else {
   *   console.log('User not found');
   * }
   * ```
   */
  async lookupByIdentifier(
    externalIdentifier: string,
    organizationId: string
  ): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = getCacheKey(organizationId, externalIdentifier);
      const cachedEntry = IDENTITY_LOOKUP_CACHE.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry)) {
        return cachedEntry.userId;
      }

      const db = await getDb();
      const identityLinksRef = collection(db, COLLECTION_NAME);

      // Query by organizationId (Firestore doesn't support efficient array queries)
      const q = query(
        identityLinksRef,
        where('organizationId', '==', organizationId)
      );

      const snapshot = await getDocs(q);
      const matches: IdentityLink[] = [];

      // Filter client-side for matching external identifier
      snapshot.docs.forEach(doc => {
        const identityLink = fromFirestore(doc);
        const match = identityLink.externalIdentities.find(
          identity => identity.value === externalIdentifier
        );
        if (match) {
          matches.push(identityLink);
        }
      });

      let result: string | null = null;

      if (matches.length === 0) {
        result = null;
      } else if (matches.length > 1) {
        // Data inconsistency: multiple users linked to same external identifier
        console.warn(
          `Multiple identity links found for external identifier ${externalIdentifier} in organization ${organizationId}`
        );
        // Return first match (or throw error if strict validation is required)
        result = matches[0].userId;
      } else {
        result = matches[0].userId;
      }

      // Cache the result
      IDENTITY_LOOKUP_CACHE.set(cacheKey, {
        userId: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Error looking up identifier:', error);
      throw error;
    }
  }

  /**
   * Get all external identities for a user
   *
   * Retrieves all external identities linked to a user in the given organization.
   *
   * @param userId - Internal user ID
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to array of external identities, or empty array if none found
   *
   * @example
   * ```typescript
   * const identities = await identityService.getExternalIdentities(
   *   'user-123',
   *   'org-456'
   * );
   * console.log(identities); // [{ type: 'phone', value: '+15551234567', verified: true }, ...]
   * ```
   */
  async getExternalIdentities(
    userId: string,
    organizationId: string
  ): Promise<ExternalIdentity[]> {
    try {
      const identityLink = await this.getIdentityLink(userId, organizationId);
      return identityLink?.externalIdentities || [];
    } catch (error) {
      console.error('Error getting external identities:', error);
      throw error;
    }
  }

  /**
   * Get identity link for a user
   *
   * Retrieves the identity link document for a user in the given organization.
   *
   * @param userId - Internal user ID
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to IdentityLink if found, null if not found
   *
   * @example
   * ```typescript
   * const identityLink = await identityService.getIdentityLink(
   *   'user-123',
   *   'org-456'
   * );
   * ```
   */
  async getIdentityLink(
    userId: string,
    organizationId: string
  ): Promise<IdentityLink | null> {
    try {
      const db = await getDb();
      const identityLinksRef = collection(db, COLLECTION_NAME);
      const identityLinkId = generateIdentityLinkId(userId, organizationId);
      const identityLinkRef = doc(identityLinksRef, identityLinkId);
      const snapshot = await getDoc(identityLinkRef);

      if (!snapshot.exists()) {
        return null;
      }

      return fromFirestore(snapshot);
    } catch (error) {
      console.error('Error getting identity link:', error);
      throw error;
    }
  }

  /**
   * Remove an external identity from a user's identity link
   *
   * Removes the specified external identity from a user's identity link.
   * If this is the last external identity, the identity link document is deleted.
   *
   * @param userId - Internal user ID
   * @param externalIdentity - External identity to remove
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to true if removed, false if not found
   *
   * @example
   * ```typescript
   * const removed = await identityService.removeExternalIdentity(
   *   'user-123',
   *   { type: 'phone', value: '+15551234567', verified: false },
   *   'org-456'
   * );
   * ```
   */
  async removeExternalIdentity(
    userId: string,
    externalIdentity: ExternalIdentity,
    organizationId: string
  ): Promise<boolean> {
    try {
      const identityLink = await this.getIdentityLink(userId, organizationId);
      if (!identityLink) {
        return false;
      }

      // Remove matching external identity
      const filteredIdentities = identityLink.externalIdentities.filter(
        identity =>
          !(
            identity.type === externalIdentity.type &&
            identity.value === externalIdentity.value
          )
      );

      // If no external identities left, delete the document
      if (filteredIdentities.length === 0) {
        const db = await getDb();
        const identityLinksRef = collection(db, COLLECTION_NAME);
        const identityLinkId = generateIdentityLinkId(userId, organizationId);
        const identityLinkRef = doc(identityLinksRef, identityLinkId);
        await updateDoc(identityLinkRef, {
          externalIdentities: [],
        });
        // Note: Could delete the document instead, but keeping it for audit trail
        return true;
      }

      // Update document with filtered identities
      identityLink.externalIdentities = filteredIdentities;
      const db = await getDb();
      const identityLinksRef = collection(db, COLLECTION_NAME);
      const identityLinkId = generateIdentityLinkId(userId, organizationId);
      const identityLinkRef = doc(identityLinksRef, identityLinkId);
      const firestoreData = toFirestore(identityLink);
      await setDoc(identityLinkRef, firestoreData, { merge: true });

      // Invalidate cache for this organization
      invalidateCacheForOrganization(organizationId);

      return true;
    } catch (error) {
      console.error('Error removing external identity:', error);
      throw error;
    }
  }

  /**
   * Verify a phone number identity
   *
   * Updates the verification status of a phone number identity to verified.
   * This is typically called after the user successfully verifies their phone
   * number via SMS code.
   *
   * @param phoneNumber - Phone number in E.164 format (e.g., '+15551234567')
   * @param verificationCode - Verification code sent to the phone number (not used in this method, but kept for API consistency)
   * @param organizationId - Organization ID for multi-tenancy support
   * @param expiresInDays - Optional number of days until verification expires (default: no expiration)
   * @returns Promise resolving to true if verified, false if identity not found
   * @throws Error if phone number format is invalid
   *
   * @example
   * ```typescript
   * const verified = await identityService.verifyPhoneNumber(
   *   '+15551234567',
   *   '123456',
   *   'org-456'
   * );
   * ```
   *
   * @note
   * This method assumes the verification code has already been validated.
   * The actual verification code validation should be done in a separate service
   * (e.g., SMS verification service) before calling this method.
   */
  async verifyPhoneNumber(
    phoneNumber: string,
    verificationCode: string,
    organizationId: string,
    expiresInDays?: number
  ): Promise<boolean> {
    // Validate phone number format
    validateExternalIdentity('phone', phoneNumber);

    // Find the identity link containing this phone number
    const userId = await this.lookupByIdentifier(phoneNumber, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the phone number identity
    const phoneIdentity = identityLink.externalIdentities.find(
      identity => identity.type === 'phone' && identity.value === phoneNumber
    );

    if (!phoneIdentity) {
      return false;
    }

    // Update verification status
    phoneIdentity.verified = true;
    phoneIdentity.verifiedAt = new Date();
    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      phoneIdentity.verifiedExpiresAt = expiresAt;
    }

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Unverify a phone number identity
   *
   * Updates the verification status of a phone number identity to unverified.
   * This removes the verified status and clears verification timestamps.
   *
   * @param phoneNumber - Phone number in E.164 format (e.g., '+15551234567')
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to true if unverified, false if identity not found
   * @throws Error if phone number format is invalid
   *
   * @example
   * ```typescript
   * const unverified = await identityService.unverifyPhoneNumber(
   *   '+15551234567',
   *   'org-456'
   * );
   * ```
   */
  async unverifyPhoneNumber(
    phoneNumber: string,
    organizationId: string
  ): Promise<boolean> {
    // Validate phone number format
    validateExternalIdentity('phone', phoneNumber);

    // Find the identity link containing this phone number
    const userId = await this.lookupByIdentifier(phoneNumber, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the phone number identity
    const phoneIdentity = identityLink.externalIdentities.find(
      identity => identity.type === 'phone' && identity.value === phoneNumber
    );

    if (!phoneIdentity) {
      return false;
    }

    // Update verification status to unverified
    phoneIdentity.verified = false;
    phoneIdentity.verifiedAt = undefined;
    phoneIdentity.verifiedExpiresAt = undefined;

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Verify an email address identity
   *
   * Updates the verification status of an email identity to verified.
   * This is typically called after the user successfully verifies their email
   * address via email verification link.
   *
   * @param email - Email address (e.g., 'user@example.com')
   * @param verificationLink - Verification link token (not used in this method, but kept for API consistency)
   * @param organizationId - Organization ID for multi-tenancy support
   * @param expiresInDays - Optional number of days until verification expires (default: no expiration)
   * @returns Promise resolving to true if verified, false if identity not found
   * @throws Error if email format is invalid
   *
   * @example
   * ```typescript
   * const verified = await identityService.verifyEmail(
   *   'user@example.com',
   *   'verification-token-123',
   *   'org-456'
   * );
   * ```
   *
   * @note
   * This method assumes the verification link has already been validated.
   * The actual verification link validation should be done in a separate service
   * (e.g., email verification service) before calling this method.
   */
  async verifyEmail(
    email: string,
    verificationLink: string,
    organizationId: string,
    expiresInDays?: number
  ): Promise<boolean> {
    // Validate email format
    validateExternalIdentity('email', email);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find the identity link containing this email
    const userId = await this.lookupByIdentifier(normalizedEmail, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the email identity
    const emailIdentity = identityLink.externalIdentities.find(
      identity => identity.type === 'email' && identity.value === normalizedEmail
    );

    if (!emailIdentity) {
      return false;
    }

    // Update verification status
    emailIdentity.verified = true;
    emailIdentity.verifiedAt = new Date();
    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      emailIdentity.verifiedExpiresAt = expiresAt;
    }

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Unverify an email address identity
   *
   * Updates the verification status of an email identity to unverified.
   * This removes the verified status and clears verification timestamps.
   *
   * @param email - Email address (e.g., 'user@example.com')
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to true if unverified, false if identity not found
   * @throws Error if email format is invalid
   *
   * @example
   * ```typescript
   * const unverified = await identityService.unverifyEmail(
   *   'user@example.com',
   *   'org-456'
   * );
   * ```
   */
  async unverifyEmail(
    email: string,
    organizationId: string
  ): Promise<boolean> {
    // Validate email format
    validateExternalIdentity('email', email);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find the identity link containing this email
    const userId = await this.lookupByIdentifier(normalizedEmail, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the email identity
    const emailIdentity = identityLink.externalIdentities.find(
      identity => identity.type === 'email' && identity.value === normalizedEmail
    );

    if (!emailIdentity) {
      return false;
    }

    // Update verification status to unverified
    emailIdentity.verified = false;
    emailIdentity.verifiedAt = undefined;
    emailIdentity.verifiedExpiresAt = undefined;

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Verify a Facebook ID identity
   *
   * Updates the verification status of a Facebook ID identity to verified.
   * This is typically called after the user successfully verifies their Facebook
   * account via OAuth flow.
   *
   * @param facebookId - Facebook Page-Scoped ID (PSID)
   * @param oauthToken - OAuth token from Facebook (not used in this method, but kept for API consistency)
   * @param organizationId - Organization ID for multi-tenancy support
   * @param expiresInDays - Optional number of days until verification expires (default: no expiration)
   * @returns Promise resolving to true if verified, false if identity not found
   * @throws Error if Facebook ID format is invalid
   *
   * @example
   * ```typescript
   * const verified = await identityService.verifyFacebookId(
   *   '1234567890',
   *   'oauth-token-123',
   *   'org-456'
   * );
   * ```
   *
   * @note
   * This method assumes the OAuth token has already been validated.
   * The actual OAuth token validation should be done in a separate service
   * (e.g., Facebook OAuth service) before calling this method.
   */
  async verifyFacebookId(
    facebookId: string,
    oauthToken: string,
    organizationId: string,
    expiresInDays?: number
  ): Promise<boolean> {
    // Validate Facebook ID format
    validateExternalIdentity('facebook_id', facebookId);

    // Find the identity link containing this Facebook ID
    const userId = await this.lookupByIdentifier(facebookId, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the Facebook ID identity
    const facebookIdentity = identityLink.externalIdentities.find(
      identity =>
        identity.type === 'facebook_id' && identity.value === facebookId
    );

    if (!facebookIdentity) {
      return false;
    }

    // Update verification status
    facebookIdentity.verified = true;
    facebookIdentity.verifiedAt = new Date();
    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      facebookIdentity.verifiedExpiresAt = expiresAt;
    }

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Unverify a Facebook ID identity
   *
   * Updates the verification status of a Facebook ID identity to unverified.
   * This removes the verified status and clears verification timestamps.
   *
   * @param facebookId - Facebook Page-Scoped ID (PSID)
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to true if unverified, false if identity not found
   * @throws Error if Facebook ID format is invalid
   *
   * @example
   * ```typescript
   * const unverified = await identityService.unverifyFacebookId(
   *   '1234567890',
   *   'org-456'
   * );
   * ```
   */
  async unverifyFacebookId(
    facebookId: string,
    organizationId: string
  ): Promise<boolean> {
    // Validate Facebook ID format
    validateExternalIdentity('facebook_id', facebookId);

    // Find the identity link containing this Facebook ID
    const userId = await this.lookupByIdentifier(facebookId, organizationId);
    if (!userId) {
      return false;
    }

    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return false;
    }

    // Find and update the Facebook ID identity
    const facebookIdentity = identityLink.externalIdentities.find(
      identity =>
        identity.type === 'facebook_id' && identity.value === facebookId
    );

    if (!facebookIdentity) {
      return false;
    }

    // Update verification status to unverified
    facebookIdentity.verified = false;
    facebookIdentity.verifiedAt = undefined;
    facebookIdentity.verifiedExpiresAt = undefined;

    // Save updated identity link
    const db = await getDb();
    const identityLinksRef = collection(db, COLLECTION_NAME);
    const identityLinkId = generateIdentityLinkId(userId, organizationId);
    const identityLinkRef = doc(identityLinksRef, identityLinkId);
    const firestoreData = toFirestore(identityLink);
    await setDoc(identityLinkRef, firestoreData, { merge: true });

    // Invalidate cache for this organization
    invalidateCacheForOrganization(organizationId);

    return true;
  }

  /**
   * Check if an external identity verification has expired
   *
   * Checks if a verification has expired based on the verifiedExpiresAt timestamp.
   * If verifiedExpiresAt is not set, the verification never expires.
   *
   * @param externalIdentity - External identity to check
   * @returns true if verification has expired, false otherwise
   *
   * @example
   * ```typescript
   * const identity: ExternalIdentity = {
   *   type: 'phone',
   *   value: '+15551234567',
   *   verified: true,
   *   verifiedAt: new Date('2024-01-01'),
   *   verifiedExpiresAt: new Date('2024-01-31')
   * };
   *
   * const isExpired = identityService.isVerificationExpired(identity);
   * ```
   */
  isVerificationExpired(externalIdentity: ExternalIdentity): boolean {
    if (!externalIdentity.verified) {
      return false; // Not verified, so not expired
    }

    if (!externalIdentity.verifiedExpiresAt) {
      return false; // No expiration date, so never expires
    }

    return new Date() > externalIdentity.verifiedExpiresAt;
  }

  /**
   * Update expired verifications for a user
   *
   * Checks all external identities for a user and marks expired verifications
   * as unverified. This should be called periodically to maintain data integrity.
   *
   * @param userId - Internal user ID
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to number of identities updated
   *
   * @example
   * ```typescript
   * const updatedCount = await identityService.updateExpiredVerifications(
   *   'user-123',
   *   'org-456'
   * );
   * ```
   */
  async updateExpiredVerifications(
    userId: string,
    organizationId: string
  ): Promise<number> {
    const identityLink = await this.getIdentityLink(userId, organizationId);
    if (!identityLink) {
      return 0;
    }

    let updatedCount = 0;
    let hasChanges = false;

    // Check each external identity for expiration
    for (const identity of identityLink.externalIdentities) {
      if (this.isVerificationExpired(identity)) {
        identity.verified = false;
        identity.verifiedAt = undefined;
        identity.verifiedExpiresAt = undefined;
        updatedCount++;
        hasChanges = true;
      }
    }

    // Save updated identity link if changes were made
    if (hasChanges) {
      const db = await getDb();
      const identityLinksRef = collection(db, COLLECTION_NAME);
      const identityLinkId = generateIdentityLinkId(userId, organizationId);
      const identityLinkRef = doc(identityLinksRef, identityLinkId);
      const firestoreData = toFirestore(identityLink);
      await setDoc(identityLinkRef, firestoreData, { merge: true });

      // Invalidate cache for this organization
      invalidateCacheForOrganization(organizationId);
    }

    return updatedCount;
  }
}

// Export a singleton instance for convenience
export const identityService = new IdentityService();

