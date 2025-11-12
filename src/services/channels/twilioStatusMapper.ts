/**
 * Twilio Status Mapper Utility
 *
 * This module provides a shared utility for mapping Twilio message statuses
 * to UnifiedMessage statuses. This ensures consistency across the codebase
 * and avoids duplication of status mapping logic.
 *
 * @example
 * ```typescript
 * import { mapTwilioStatusToUnifiedStatus } from './twilioStatusMapper';
 *
 * const unifiedStatus = mapTwilioStatusToUnifiedStatus('delivered');
 * console.log(unifiedStatus); // 'delivered'
 * ```
 */

import type { MessageStatus } from '../../types/Channel';

/**
 * Map Twilio message status to UnifiedMessage status
 *
 * Converts Twilio's message status values to the standardized UnifiedMessage
 * status format used across all channels in the system.
 *
 * @param twilioStatus - Twilio message status (case-insensitive)
 * @returns UnifiedMessage status
 *
 * @example
 * ```typescript
 * mapTwilioStatusToUnifiedStatus('queued'); // 'sending'
 * mapTwilioStatusToUnifiedStatus('sent'); // 'sent'
 * mapTwilioStatusToUnifiedStatus('delivered'); // 'delivered'
 * mapTwilioStatusToUnifiedStatus('failed'); // 'failed'
 * ```
 */
export function mapTwilioStatusToUnifiedStatus(
  twilioStatus: string
): MessageStatus {
  const statusMap: Record<string, MessageStatus> = {
    queued: 'sending',
    sending: 'sending',
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    undelivered: 'failed',
    canceled: 'failed',
  };

  return statusMap[twilioStatus.toLowerCase()] || 'failed';
}







