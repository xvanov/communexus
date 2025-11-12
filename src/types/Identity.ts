/**
 * Identity Types
 *
 * This module defines the identity linking data model and types used for
 * linking external identifiers (phone numbers, emails, Facebook IDs) to
 * internal user identities in the Communexus platform.
 *
 * The identity linking system enables message routing across channels by
 * resolving external identifiers to internal user IDs, allowing messages
 * from the same person across different channels to appear in the same thread.
 */

/**
 * External Identity Type
 *
 * Defines the types of external identifiers that can be linked to internal user IDs.
 * Each type corresponds to a communication channel:
 * - 'phone': Phone number (E.164 format, e.g., '+15551234567')
 * - 'email': Email address (e.g., 'user@example.com')
 * - 'facebook_id': Facebook Page-Scoped ID (PSID)
 * - 'whatsapp_id': WhatsApp Business Account ID (future)
 *
 * @example
 * ```typescript
 * const identityType: ExternalIdentityType = 'phone';
 * ```
 */
export type ExternalIdentityType = 'phone' | 'email' | 'facebook_id' | 'whatsapp_id';

/**
 * External Identity
 *
 * Represents a single external identifier linked to a user.
 * Each external identity has a type, value, and verification status.
 *
 * @example
 * ```typescript
 * const phoneIdentity: ExternalIdentity = {
 *   type: 'phone',
 *   value: '+15551234567',
 *   verified: true
 * };
 * ```
 */
export interface ExternalIdentity {
  /**
   * Type of external identity
   * @example 'phone', 'email', 'facebook_id'
   */
  type: ExternalIdentityType;

  /**
   * Value of the external identity
   * Format depends on type:
   * - phone: E.164 format (e.g., '+15551234567')
   * - email: Email address (e.g., 'user@example.com')
   * - facebook_id: Facebook PSID (e.g., '1234567890')
   * - whatsapp_id: WhatsApp Business Account ID (future)
   */
  value: string;

  /**
   * Verification status
   * - true: Identity has been verified (e.g., phone via SMS code, email via link)
   * - false: Identity has not been verified yet
   */
  verified: boolean;

  /**
   * Timestamp when the identity was verified
   * Optional - only set when verified is true
   */
  verifiedAt?: Date;

  /**
   * Timestamp when the verification expires
   * Optional - only set if verification has an expiration time
   * If not set, verification does not expire
   */
  verifiedExpiresAt?: Date;
}

/**
 * Identity Link
 *
 * Represents the link between a user and their external identities.
 * One IdentityLink document exists per user per organization, containing
 * all external identities linked to that user.
 *
 * Firestore Collection: `identityLinks`
 * Document Structure: `identityLinks/{id}`
 *
 * @example
 * ```typescript
 * const identityLink: IdentityLink = {
 *   id: 'link-123',
 *   userId: 'user-456',
 *   organizationId: 'org-789',
 *   externalIdentities: [
 *     { type: 'phone', value: '+15551234567', verified: true },
 *     { type: 'email', value: 'user@example.com', verified: true }
 *   ],
 *   createdAt: new Date()
 * };
 * ```
 */
export interface IdentityLink {
  /**
   * Unique identifier for the identity link document
   * Firestore document ID
   */
  id: string;

  /**
   * Internal user ID this identity link belongs to
   * References the user.id field
   */
  userId: string;

  /**
   * Organization ID this identity link belongs to
   * Enables multi-tenancy support
   */
  organizationId: string;

  /**
   * Array of external identities linked to this user
   * Each external identity can be of different types (phone, email, Facebook ID, etc.)
   * Multiple external identities can be linked to the same user
   */
  externalIdentities: ExternalIdentity[];

  /**
   * Timestamp when the identity link was created
   * Firestore Timestamp (converted to Date in TypeScript interface)
   */
  createdAt: Date;
}

/**
 * Firestore Collection Structure
 *
 * Collection: `identityLinks`
 * Document ID: Auto-generated or custom ID
 *
 * Document Schema:
 * ```typescript
 * {
 *   id: string;                    // Firestore document ID
 *   userId: string;                 // Internal user ID
 *   organizationId: string;         // Organization ID for multi-tenancy
 *   externalIdentities: Array<{    // Array of external identities
 *     type: 'phone' | 'email' | 'facebook_id' | 'whatsapp_id';
 *     value: string;
 *     verified: boolean;
 *   }>;
 *   createdAt: Timestamp;           // Firestore Timestamp
 * }
 * ```
 *
 * Indexing:
 * - Compound index on (organizationId, externalIdentities.value) for efficient lookup
 * - Single-field index on userId for user identity link queries
 *
 * Security Rules:
 * - Users can read their own identity links (userId == request.auth.uid)
 * - Admins can read/write all identity links (isAdmin == true)
 * - Users cannot modify other users' identity links
 * - External identity format validation enforced in rules
 */

