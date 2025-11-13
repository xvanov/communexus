"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTwilioStatusToUnifiedStatus = mapTwilioStatusToUnifiedStatus;
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
function mapTwilioStatusToUnifiedStatus(twilioStatus) {
    const statusMap = {
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
//# sourceMappingURL=twilioStatusMapper.js.map