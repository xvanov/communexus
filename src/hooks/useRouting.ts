/**
 * Routing Hook
 *
 * This hook provides routing functionality for UI components.
 * It wraps the RoutingService and provides loading, error, and result states.
 *
 * @example
 * ```typescript
 * const { routeMessage, loading, error, routingResult, routingLog } = useRouting();
 *
 * const handleRouteMessage = async () => {
 *   const result = await routeMessage(unifiedMessage, organizationId);
 *   if (result) {
 *     console.log(`Routed to thread ${result.threadId}`);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { RoutingService, RoutingResult, RoutingDecision } from '../services/routing';
import type { UnifiedMessage } from '../types/Channel';

/**
 * Hook return type
 */
interface UseRoutingReturn {
  /**
   * Route a message using multi-strategy approach
   */
  routeMessage: (
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ) => Promise<RoutingResult | null>;

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error: string | null;

  /**
   * Routing result state
   */
  routingResult: RoutingResult | null;

  /**
   * Routing decision log state
   */
  routingLog: RoutingDecision | null;

  /**
   * Reset hook state
   */
  reset: () => void;
}

/**
 * Routing hook
 *
 * Provides routing functionality with loading, error, and result states.
 *
 * @returns UseRoutingReturn object with routeMessage function and state
 *
 * @example
 * ```typescript
 * const { routeMessage, loading, error, routingResult } = useRouting();
 *
 * useEffect(() => {
 *   const route = async () => {
 *     const result = await routeMessage(unifiedMessage, organizationId);
 *     if (result) {
 *       console.log(`Routed to thread ${result.threadId}`);
 *     }
 *   };
 *   route();
 * }, [unifiedMessage, organizationId]);
 * ```
 */
export const useRouting = (): UseRoutingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [routingLog, setRoutingLog] = useState<RoutingDecision | null>(null);

  const routingService = new RoutingService();

  const routeMessage = useCallback(
    async (
      unifiedMessage: UnifiedMessage,
      organizationId: string
    ): Promise<RoutingResult | null> => {
      setLoading(true);
      setError(null);
      setRoutingResult(null);
      setRoutingLog(null);

      try {
        const result = await routingService.routeMessage(
          unifiedMessage,
          organizationId
        );

        setRoutingResult(result);
        setLoading(false);

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        setRoutingResult(null);
        setRoutingLog(null);

        console.error('Error routing message:', err);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setRoutingResult(null);
    setRoutingLog(null);
  }, []);

  return {
    routeMessage,
    loading,
    error,
    routingResult,
    routingLog,
    reset,
  };
};








