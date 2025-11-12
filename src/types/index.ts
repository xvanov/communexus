/**
 * Types Barrel Export
 *
 * This module provides a centralized export point for all TypeScript types
 * used throughout the application. This enables clean imports throughout the codebase.
 *
 * @example
 * ```typescript
 * import { UnifiedMessage, ChannelType } from '@/types';
 * ```
 */

// Channel types
export type {
  UnifiedMessage,
  ChannelMessage,
  ChannelMessageResult,
  MessageStatus,
  ChannelType,
  MessageDirection,
} from './Channel';

// Identity types
export type {
  IdentityLink,
  ExternalIdentity,
  ExternalIdentityType,
} from './Identity';

// Existing types
export type { Message } from './Message';
export type { Thread } from './Thread';
export type { User } from './User';
export type { Notification } from './Notification';
export type { Media } from './Media';
export type * from './AIFeatures';
