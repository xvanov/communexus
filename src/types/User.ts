// User.ts - User data model and TypeScript interfaces
// TODO: Define complete User interface based on Firestore schema
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'contractor' | 'client' | 'vendor';
  photoUrl?: string;
  online: boolean;
  lastSeen: Date;
  typing?: { threadId: string; timestamp: Date } | null;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
