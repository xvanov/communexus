// Media.ts - Media data model and TypeScript interfaces

export type MediaType = 'image' | 'video' | 'file';

export interface Media {
  id: string;
  threadId: string;
  messageId?: string;
  url: string;
  type: MediaType;
  fileName: string;
  fileSize?: number;
  width?: number;
  height?: number;
  createdAt: Date;
  uploadedBy: string; // userId
}
