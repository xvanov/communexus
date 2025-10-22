// Notification.ts - Notification data model

export type NotificationType = 'message' | 'mention' | 'priority' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  timestamp: Date;
}


