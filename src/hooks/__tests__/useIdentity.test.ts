/**
 * Unit Tests for Identity Hooks
 *
 * These tests verify that:
 * - useLinkIdentity hook correctly links identities with loading/error states
 * - useLookupIdentity hook correctly looks up identities
 * - useIdentityLinks hook fetches and refreshes identity links
 * - useVerifyIdentity hook verifies identities correctly
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  useLinkIdentity,
  useLookupIdentity,
  useIdentityLinks,
  useVerifyIdentity,
} from '../useIdentity';
import { identityService } from '../../services/identity';
import {
  IdentityLink,
  ExternalIdentity,
} from '../../types/Identity';

// Mock the identity service
jest.mock('../../services/identity');

describe('Identity Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLinkIdentity', () => {
    test('linkPhoneNumber updates loading and error states correctly', async () => {
      const mockIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId: 'org-456',
        externalIdentities: [
          {
            type: 'phone',
            value: '+15551234567',
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      (identityService.linkPhoneNumber as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      const { result } = renderHook(() => useLinkIdentity());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      let linkResult: IdentityLink | null = null;

      await act(async () => {
        linkResult = await result.current.linkPhoneNumber(
          'user-123',
          '+15551234567',
          'org-456'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(linkResult).toEqual(mockIdentityLink);
      expect(identityService.linkPhoneNumber).toHaveBeenCalledWith(
        'user-123',
        '+15551234567',
        'org-456'
      );
    });

    test('linkPhoneNumber handles errors correctly', async () => {
      const error = new Error('Failed to link phone number');
      (identityService.linkPhoneNumber as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useLinkIdentity());

      await act(async () => {
        const linkResult = await result.current.linkPhoneNumber(
          'user-123',
          '+15551234567',
          'org-456'
        );
        expect(linkResult).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to link phone number');
    });

    test('linkEmail updates loading and error states correctly', async () => {
      const mockIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId: 'org-456',
        externalIdentities: [
          {
            type: 'email',
            value: 'user@example.com',
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      (identityService.linkEmail as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      const { result } = renderHook(() => useLinkIdentity());

      await act(async () => {
        await result.current.linkEmail(
          'user-123',
          'user@example.com',
          'org-456'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(identityService.linkEmail).toHaveBeenCalledWith(
        'user-123',
        'user@example.com',
        'org-456'
      );
    });

    test('linkFacebookId updates loading and error states correctly', async () => {
      const mockIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId: 'org-456',
        externalIdentities: [
          {
            type: 'facebook_id',
            value: '1234567890',
            verified: false,
          },
        ],
        createdAt: new Date(),
      };

      (identityService.linkFacebookId as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      const { result } = renderHook(() => useLinkIdentity());

      await act(async () => {
        await result.current.linkFacebookId(
          'user-123',
          '1234567890',
          'org-456'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(identityService.linkFacebookId).toHaveBeenCalledWith(
        'user-123',
        '1234567890',
        'org-456'
      );
    });
  });

  describe('useLookupIdentity', () => {
    test('lookupIdentity updates loading and error states correctly', async () => {
      (identityService.lookupByIdentifier as jest.Mock).mockResolvedValue(
        'user-123'
      );

      const { result } = renderHook(() => useLookupIdentity());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      let lookupResult: string | null = null;

      await act(async () => {
        lookupResult = await result.current.lookupIdentity(
          '+15551234567',
          'org-456'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(lookupResult).toBe('user-123');
      expect(identityService.lookupByIdentifier).toHaveBeenCalledWith(
        '+15551234567',
        'org-456'
      );
    });

    test('lookupIdentity handles null result correctly', async () => {
      (identityService.lookupByIdentifier as jest.Mock).mockResolvedValue(
        null
      );

      const { result } = renderHook(() => useLookupIdentity());

      await act(async () => {
        const lookupResult = await result.current.lookupIdentity(
          '+15551234567',
          'org-456'
        );
        expect(lookupResult).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('lookupIdentity handles errors correctly', async () => {
      const error = new Error('Failed to lookup identity');
      (identityService.lookupByIdentifier as jest.Mock).mockRejectedValue(
        error
      );

      const { result } = renderHook(() => useLookupIdentity());

      await act(async () => {
        const lookupResult = await result.current.lookupIdentity(
          '+15551234567',
          'org-456'
        );
        expect(lookupResult).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to lookup identity');
    });
  });

  describe('useIdentityLinks', () => {
    test('fetches identity links on mount', async () => {
      const mockIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId: 'org-456',
        externalIdentities: [
          {
            type: 'phone',
            value: '+15551234567',
            verified: true,
          },
        ],
        createdAt: new Date(),
      };

      (identityService.getIdentityLink as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      const { result } = renderHook(() =>
        useIdentityLinks('user-123', 'org-456')
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.identityLinks).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.identityLinks).toEqual(mockIdentityLink);
      expect(identityService.getIdentityLink).toHaveBeenCalledWith(
        'user-123',
        'org-456'
      );
    });

    test('returns null when userId or organizationId is null', () => {
      const { result } = renderHook(() => useIdentityLinks(null, null));

      expect(result.current.loading).toBe(false);
      expect(result.current.identityLinks).toBeNull();
      expect(identityService.getIdentityLink).not.toHaveBeenCalled();
    });

    test('refresh function refetches identity links', async () => {
      const mockIdentityLink: IdentityLink = {
        id: 'org-456-user-123',
        userId: 'user-123',
        organizationId: 'org-456',
        externalIdentities: [],
        createdAt: new Date(),
      };

      (identityService.getIdentityLink as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      const { result } = renderHook(() =>
        useIdentityLinks('user-123', 'org-456')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      jest.clearAllMocks();
      (identityService.getIdentityLink as jest.Mock).mockResolvedValue(
        mockIdentityLink
      );

      await act(async () => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(identityService.getIdentityLink).toHaveBeenCalledTimes(1);
    });

    test('handles errors correctly', async () => {
      const error = new Error('Failed to fetch identity links');
      (identityService.getIdentityLink as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useIdentityLinks('user-123', 'org-456')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch identity links');
      expect(result.current.identityLinks).toBeNull();
    });
  });

  describe('useVerifyIdentity', () => {
    test('verifyPhoneNumber updates loading and error states correctly', async () => {
      (identityService.verifyPhoneNumber as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useVerifyIdentity());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      let verifyResult: boolean = false;

      await act(async () => {
        verifyResult = await result.current.verifyPhoneNumber(
          '+15551234567',
          '123456',
          'org-456'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(verifyResult).toBe(true);
      expect(identityService.verifyPhoneNumber).toHaveBeenCalledWith(
        '+15551234567',
        '123456',
        'org-456',
        undefined
      );
    });

    test('verifyPhoneNumber handles errors correctly', async () => {
      const error = new Error('Failed to verify phone number');
      (identityService.verifyPhoneNumber as jest.Mock).mockRejectedValue(
        error
      );

      const { result } = renderHook(() => useVerifyIdentity());

      await act(async () => {
        const verifyResult = await result.current.verifyPhoneNumber(
          '+15551234567',
          '123456',
          'org-456'
        );
        expect(verifyResult).toBe(false);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to verify phone number');
    });

    test('verifyEmail updates loading and error states correctly', async () => {
      (identityService.verifyEmail as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useVerifyIdentity());

      await act(async () => {
        const verifyResult = await result.current.verifyEmail(
          'user@example.com',
          'verification-token',
          'org-456'
        );
        expect(verifyResult).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(identityService.verifyEmail).toHaveBeenCalledWith(
        'user@example.com',
        'verification-token',
        'org-456',
        undefined
      );
    });

    test('verifyFacebookId updates loading and error states correctly', async () => {
      (identityService.verifyFacebookId as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useVerifyIdentity());

      await act(async () => {
        const verifyResult = await result.current.verifyFacebookId(
          '1234567890',
          'oauth-token',
          'org-456'
        );
        expect(verifyResult).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(identityService.verifyFacebookId).toHaveBeenCalledWith(
        '1234567890',
        'oauth-token',
        'org-456',
        undefined
      );
    });
  });
});








