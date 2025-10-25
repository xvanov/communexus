// storage.ts - Image upload and media sharing with Firebase Storage
import { getBucket } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Media, MediaType } from '../types/Media';

// Upload image to Firebase Storage
export const uploadImage = async (
  imageUri: string,
  threadId: string,
  userId: string,
  fileName?: string
): Promise<{ url: string; mediaId: string }> => {
  const storage = await getBucket();
  const timestamp = Date.now();
  const fileExtension = imageUri.split('.').pop() || 'jpg';
  const mediaId = `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const storageFileName = fileName || `${mediaId}.${fileExtension}`;

  const storageRef = ref(
    storage,
    `threads/${threadId}/media/${storageFileName}`
  );

  try {
    // Convert URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload the file
    const snapshot = await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      mediaId,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload document to Firebase Storage
export const uploadDocument = async (
  documentUri: string,
  threadId: string,
  userId: string,
  fileName?: string
): Promise<{ url: string; mediaId: string }> => {
  const storage = await getBucket();
  const timestamp = Date.now();
  const fileExtension = documentUri.split('.').pop() || 'pdf';
  const mediaId = `media_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const storageFileName = fileName || `${mediaId}.${fileExtension}`;

  const storageRef = ref(
    storage,
    `threads/${threadId}/documents/${storageFileName}`
  );

  try {
    // Convert URI to blob for upload
    const response = await fetch(documentUri);
    const blob = await response.blob();

    // Upload the file
    const snapshot = await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      mediaId,
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
};

// Delete media from Firebase Storage
export const deleteMedia = async (mediaUrl: string): Promise<void> => {
  const storage = await getBucket();

  try {
    // Extract the path from the URL
    const url = new URL(mediaUrl);
    const path = decodeURIComponent(
      url.pathname.split('/o/')[1]?.split('?')[0] || ''
    );

    if (path) {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw new Error('Failed to delete media');
  }
};

// Get media type from file extension
export const getMediaType = (fileName: string): MediaType => {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else {
    return 'file';
  }
};

// Create media object
export const createMediaObject = (
  mediaId: string,
  threadId: string,
  url: string,
  fileName: string,
  uploadedBy: string,
  messageId?: string
): Media => {
  const type = getMediaType(fileName);

  return {
    id: mediaId,
    threadId,
    ...(messageId && { messageId }),
    url,
    type,
    fileName,
    createdAt: new Date(),
    uploadedBy,
  };
};
