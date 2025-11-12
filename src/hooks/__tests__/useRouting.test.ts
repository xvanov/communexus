/**
 * Unit Tests for Routing Hook
 *
 * These tests verify that:
 * - useRouting hook correctly routes messages with loading/error states
 * - Routing result state updates correctly
 * - Error handling works properly
 * - Reset function clears state
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRouting } from '../useRouting';
import { RoutingService } from '../../services/routing';
import type { UnifiedMessage } from '../../types/Channel';
import type { RoutingResult } from '../../services/routing';

// Mock the routing service
jest.mock('../../services/routing');

const mockRoutingService = RoutingService as jest.MockedClass<typeof RoutingService>;

describe('useRouting', () => {
  let mockRoutingServiceInstance: jest.Mocked<RoutingService>;
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock routing service instance
    mockRoutingServiceInstance = {
      routeMessage: jest.fn(),
    } as any;

    mockRoutingService.mockImplementation(() => mockRoutingServiceInstance);
  });

  describe('routeMessage', () => {
    test('routes message successfully and updates state', async () => {
      const mockRoutingResult: RoutingResult = {
        threadId: 'thread-123',
        confidence: 0.9,
        method: 'identity',
        reason: 'Matched by participant identity',
      };

      mockRoutingServiceInstance.routeMessage.mockResolvedValue(mockRoutingResult);

      const { result } = renderHook(() => useRouting());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toBeNull();

      let routeResult: RoutingResult | null = null;

      await act(async () => {
        routeResult = await result.current.routeMessage(unifiedMessage, organizationId);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toEqual(mockRoutingResult);
      expect(routeResult).toEqual(mockRoutingResult);
      expect(mockRoutingServiceInstance.routeMessage).toHaveBeenCalledWith(
        unifiedMessage,
        organizationId
      );
    });

    test('handles routing failure (null result)', async () => {
      mockRoutingServiceInstance.routeMessage.mockResolvedValue(null);

      const { result } = renderHook(() => useRouting());

      await act(async () => {
        const routeResult = await result.current.routeMessage(unifiedMessage, organizationId);
        expect(routeResult).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toBeNull();
    });

    test('handles errors correctly', async () => {
      const error = new Error('Failed to route message');
      mockRoutingServiceInstance.routeMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useRouting());

      await act(async () => {
        const routeResult = await result.current.routeMessage(unifiedMessage, organizationId);
        expect(routeResult).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to route message');
      expect(result.current.routingResult).toBeNull();
      expect(result.current.routingLog).toBeNull();
    });

    test('updates loading state during routing', async () => {
      let resolvePromise: (value: RoutingResult | null) => void;
      const promise = new Promise<RoutingResult | null>((resolve) => {
        resolvePromise = resolve;
      });

      mockRoutingServiceInstance.routeMessage.mockReturnValue(promise);

      const { result } = renderHook(() => useRouting());

      act(() => {
        result.current.routeMessage(unifiedMessage, organizationId);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toBeNull();

      await act(async () => {
        resolvePromise!({
          threadId: 'thread-123',
          confidence: 0.9,
          method: 'identity',
          reason: 'Matched',
        });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    test('clears previous state when routing new message', async () => {
      const firstResult: RoutingResult = {
        threadId: 'thread-1',
        confidence: 0.9,
        method: 'identity',
        reason: 'First match',
      };

      const secondResult: RoutingResult = {
        threadId: 'thread-2',
        confidence: 0.8,
        method: 'metadata',
        reason: 'Second match',
      };

      mockRoutingServiceInstance.routeMessage
        .mockResolvedValueOnce(firstResult)
        .mockResolvedValueOnce(secondResult);

      const { result } = renderHook(() => useRouting());

      // First routing
      await act(async () => {
        await result.current.routeMessage(unifiedMessage, organizationId);
      });

      expect(result.current.routingResult).toEqual(firstResult);

      // Second routing should clear previous result
      await act(async () => {
        await result.current.routeMessage(unifiedMessage, organizationId);
      });

      expect(result.current.routingResult).toEqual(secondResult);
      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    test('resets all state to initial values', async () => {
      const mockRoutingResult: RoutingResult = {
        threadId: 'thread-123',
        confidence: 0.9,
        method: 'identity',
        reason: 'Matched',
      };

      mockRoutingServiceInstance.routeMessage.mockResolvedValue(mockRoutingResult);

      const { result } = renderHook(() => useRouting());

      // Route a message first
      await act(async () => {
        await result.current.routeMessage(unifiedMessage, organizationId);
      });

      expect(result.current.routingResult).not.toBeNull();

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toBeNull();
      expect(result.current.routingLog).toBeNull();
    });
  });

  describe('initial state', () => {
    test('initializes with correct default values', () => {
      const { result } = renderHook(() => useRouting());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.routingResult).toBeNull();
      expect(result.current.routingLog).toBeNull();
      expect(typeof result.current.routeMessage).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });
});







