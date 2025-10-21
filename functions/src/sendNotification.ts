// sendNotification.ts - Push notification Cloud Function
// TODO: Implement Firebase Cloud Messaging for push notifications
import { onCall } from 'firebase-functions/v2/https';

export const sendNotification = onCall(async request => {
  // TODO: Implement push notification sending
  return { success: true };
});
