/**
 * Channel Services Barrel Export
 *
 * This module provides a centralized export point for all channel-related
 * services and interfaces. This enables clean imports throughout the codebase.
 *
 * @example
 * ```typescript
 * import { ChannelAdapter } from '@/services/channels';
 * ```
 */

export type { ChannelAdapter } from './adapter';
export { TwilioSMSAdapter } from './sms';
export type { TwilioCredentials } from './twilioConfig';
export { getTwilioClient, getTwilioCredentialsFromEnv } from './twilioConfig';
export { mapTwilioStatusToUnifiedStatus } from './twilioStatusMapper';
