/**
 * Identity Hooks
 *
 * React hooks for identity linking operations.
 * Provides hooks for linking identities, looking up identities, fetching identity links,
 * and verifying identities with loading and error states.
 *
 * @example
 * ```typescript
 * import { useLinkIdentity, useLookupIdentity, useIdentityLinks } from './useIdentity';
 *
 * // In a component
 * const { linkIdentity, loading, error } = useLinkIdentity();
 * const { lookupIdentity, loading: lookupLoading } = useLookupIdentity();
 * const { identityLinks, loading: linksLoading } = useIdentityLinks('user-123', 'org-456');
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import {
  identityService,
  IdentityService,
} from '../services/identity';
import {
  IdentityLink,
  ExternalIdentity,
  ExternalIdentityType,
} from '../types/Identity';

/**
 * Hook for linking external identities to users
 *
 * Provides functionality to link phone numbers, emails, and Facebook IDs to user IDs.
 * Includes loading and error states, and optimistic updates for better UX.
 *
 * @returns Object containing link functions, loading state, and error state
 *
 * @example
 * ```typescript
 * const { linkPhoneNumber, linkEmail, linkFacebookId, loading, error } = useLinkIdentity();
 *
 * const handleLinkPhone = async () => {
 *   await linkPhoneNumber('user-123', '+15551234567', 'org-456');
 * };
 * ```
 */
export const useLinkIdentity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkPhoneNumber = useCallback(
    async (
      userId: string,
      phoneNumber: string,
      organizationId: string
    ): Promise<IdentityLink | null> => {
      try {
        setLoading(true);
        setError(null);

        const identityLink = await identityService.linkPhoneNumber(
          userId,
          phoneNumber,
          organizationId
        );

        return identityLink;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to link phone number';
        setError(errorMessage);
        console.error('Error linking phone number:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const linkEmail = useCallback(
    async (
      userId: string,
      email: string,
      organizationId: string
    ): Promise<IdentityLink | null> => {
      try {
        setLoading(true);
        setError(null);

        const identityLink = await identityService.linkEmail(
          userId,
          email,
          organizationId
        );

        return identityLink;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to link email';
        setError(errorMessage);
        console.error('Error linking email:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const linkFacebookId = useCallback(
    async (
      userId: string,
      facebookId: string,
      organizationId: string
    ): Promise<IdentityLink | null> => {
      try {
        setLoading(true);
        setError(null);

        const identityLink = await identityService.linkFacebookId(
          userId,
          facebookId,
          organizationId
        );

        return identityLink;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to link Facebook ID';
        setError(errorMessage);
        console.error('Error linking Facebook ID:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addExternalIdentity = useCallback(
    async (
      userId: string,
      externalIdentity: ExternalIdentity,
      organizationId: string
    ): Promise<IdentityLink | null> => {
      try {
        setLoading(true);
        setError(null);

        const identityLink = await identityService.addExternalIdentity(
          userId,
          externalIdentity,
          organizationId
        );

        return identityLink;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to add external identity';
        setError(errorMessage);
        console.error('Error adding external identity:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    linkPhoneNumber,
    linkEmail,
    linkFacebookId,
    addExternalIdentity,
    loading,
    error,
  };
};

/**
 * Hook for looking up user IDs by external identifiers
 *
 * Provides functionality to find user IDs linked to phone numbers, emails, or Facebook IDs.
 * Includes loading and error states.
 *
 * @returns Object containing lookup function, loading state, and error state
 *
 * @example
 * ```typescript
 * const { lookupIdentity, loading, error } = useLookupIdentity();
 *
 * const handleLookup = async () => {
 *   const userId = await lookupIdentity('+15551234567', 'org-456');
 *   if (userId) {
 *     console.log('Found user:', userId);
 *   }
 * };
 * ```
 */
export const useLookupIdentity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupIdentity = useCallback(
    async (
      externalIdentifier: string,
      organizationId: string
    ): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        const userId = await identityService.lookupByIdentifier(
          externalIdentifier,
          organizationId
        );

        return userId;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to lookup identity';
        setError(errorMessage);
        console.error('Error looking up identity:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    lookupIdentity,
    loading,
    error,
  };
};

/**
 * Hook for fetching identity links for a user
 *
 * Provides functionality to fetch all identity links (external identities) for a user.
 * Includes loading and error states, and automatic refresh on user/organization changes.
 *
 * @param userId - Internal user ID to fetch identity links for
 * @param organizationId - Organization ID for multi-tenancy support
 * @returns Object containing identity links, loading state, and error state
 *
 * @example
 * ```typescript
 * const { identityLinks, loading, error, refresh } = useIdentityLinks('user-123', 'org-456');
 *
 * if (loading) {
 *   return <Loading />;
 * }
 *
 * return (
 *   <div>
 *     {identityLinks.externalIdentities.map(identity => (
 *       <div key={identity.value}>{identity.type}: {identity.value}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useIdentityLinks = (
  userId: string | null,
  organizationId: string | null
) => {
  const [identityLinks, setIdentityLinks] = useState<IdentityLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentityLinks = useCallback(async () => {
    if (!userId || !organizationId) {
      setIdentityLinks(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const links = await identityService.getIdentityLink(
        userId,
        organizationId
      );

      setIdentityLinks(links);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch identity links';
      setError(errorMessage);
      console.error('Error fetching identity links:', err);
      setIdentityLinks(null);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId]);

  useEffect(() => {
    fetchIdentityLinks();
  }, [fetchIdentityLinks]);

  return {
    identityLinks,
    loading,
    error,
    refresh: fetchIdentityLinks,
  };
};

/**
 * Hook for verifying external identities
 *
 * Provides functionality to verify phone numbers, emails, and Facebook IDs.
 * Includes loading and error states, and optimistic updates for better UX.
 *
 * @returns Object containing verification functions, loading state, and error state
 *
 * @example
 * ```typescript
 * const { verifyPhoneNumber, verifyEmail, verifyFacebookId, loading, error } = useVerifyIdentity();
 *
 * const handleVerifyPhone = async () => {
 *   const verified = await verifyPhoneNumber('+15551234567', '123456', 'org-456');
 *   if (verified) {
 *     console.log('Phone number verified!');
 *   }
 * };
 * ```
 */
export const useVerifyIdentity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPhoneNumber = useCallback(
    async (
      phoneNumber: string,
      verificationCode: string,
      organizationId: string,
      expiresInDays?: number
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const verified = await identityService.verifyPhoneNumber(
          phoneNumber,
          verificationCode,
          organizationId,
          expiresInDays
        );

        return verified;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to verify phone number';
        setError(errorMessage);
        console.error('Error verifying phone number:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (
      email: string,
      verificationLink: string,
      organizationId: string,
      expiresInDays?: number
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const verified = await identityService.verifyEmail(
          email,
          verificationLink,
          organizationId,
          expiresInDays
        );

        return verified;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to verify email';
        setError(errorMessage);
        console.error('Error verifying email:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyFacebookId = useCallback(
    async (
      facebookId: string,
      oauthToken: string,
      organizationId: string,
      expiresInDays?: number
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const verified = await identityService.verifyFacebookId(
          facebookId,
          oauthToken,
          organizationId,
          expiresInDays
        );

        return verified;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to verify Facebook ID';
        setError(errorMessage);
        console.error('Error verifying Facebook ID:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const unverifyPhoneNumber = useCallback(
    async (phoneNumber: string, organizationId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const unverified = await identityService.unverifyPhoneNumber(
          phoneNumber,
          organizationId
        );

        return unverified;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to unverify phone number';
        setError(errorMessage);
        console.error('Error unverifying phone number:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const unverifyEmail = useCallback(
    async (email: string, organizationId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const unverified = await identityService.unverifyEmail(
          email,
          organizationId
        );

        return unverified;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to unverify email';
        setError(errorMessage);
        console.error('Error unverifying email:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const unverifyFacebookId = useCallback(
    async (facebookId: string, organizationId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const unverified = await identityService.unverifyFacebookId(
          facebookId,
          organizationId
        );

        return unverified;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to unverify Facebook ID';
        setError(errorMessage);
        console.error('Error unverifying Facebook ID:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    verifyPhoneNumber,
    verifyEmail,
    verifyFacebookId,
    unverifyPhoneNumber,
    unverifyEmail,
    unverifyFacebookId,
    loading,
    error,
  };
};

