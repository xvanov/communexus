// Thread.ts - Thread data model and TypeScript interfaces
// TODO: Define complete Thread interface based on Firestore schema
export interface Thread {
  id: string;
  participants: string[];
  participantDetails: {
    id: string;
    name: string;
    photoUrl?: string;
  }[];
  isGroup: boolean;
  groupName?: string;
  groupPhotoUrl?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
