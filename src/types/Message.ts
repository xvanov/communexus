// Message.ts - Message data model and TypeScript interfaces
// TODO: Define complete Message interface based on Firestore schema
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  deliveredTo: string[];
  readBy: string[];
  readTimestamps: Record<string, Date>;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  priority?: 'urgent' | 'high' | 'normal';
  isDecision?: boolean;
  deleted: boolean;
}
