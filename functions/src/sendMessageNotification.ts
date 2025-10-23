// sendMessageNotification.ts - Auto-send notifications when messages are created
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

setGlobalOptions({ region: 'us-central1' });

if (getAdminApps().length === 0) {
  initializeAdminApp();
}

/**
 * Cloud Function that automatically sends push notifications
 * when a new message is created in any thread
 */
export const sendMessageNotification = onDocumentCreated(
  'threads/{threadId}/messages/{messageId}',
  async event => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in snapshot');
      return;
    }

    const messageData = snapshot.data();
    const threadId = event.params.threadId;
    const senderId = messageData.senderId;
    const senderName = messageData.senderName;
    const messageText = messageData.text;

    console.log(
      `New message in thread ${threadId} from ${senderName}: ${messageText}`
    );

    try {
      // Get thread to find participants
      const db = getFirestore();
      const threadDoc = await db.doc(`threads/${threadId}`).get();

      if (!threadDoc.exists) {
        console.log('Thread not found');
        return;
      }

      const threadData = threadDoc.data();
      const participants = threadData?.participants || [];

      // Get push tokens for all participants except the sender
      const recipientIds = participants.filter((id: string) => id !== senderId);

      if (recipientIds.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // Fetch user documents to get push tokens and preferences
      const userDocs = await Promise.all(
        recipientIds.map((id: string) => db.doc(`users/${id}`).get())
      );

      const tokens: string[] = [];
      for (const userDoc of userDocs) {
        if (!userDoc.exists) continue;

        const userData = userDoc.data();
        const pushToken = userData?.expoPushToken;

        if (pushToken) {
          // Check notification preferences
          const prefsDoc = await db
            .doc(`notificationPreferences/${userDoc.id}`)
            .get();
          const prefs = prefsDoc.exists ? prefsDoc.data() : {};

          // Only send if notifications are enabled
          if (
            prefs?.enabled !== false &&
            prefs?.messageNotifications !== false
          ) {
            tokens.push(pushToken);
          }
        }
      }

      if (tokens.length === 0) {
        console.log('No valid push tokens found');
        return;
      }

      // Send notification to all recipients
      const messaging = getMessaging();
      const notification = {
        title: senderName,
        body: messageText.substring(0, 100), // Limit message length
      };

      const data = {
        threadId,
        senderId,
        messageId: snapshot.id,
        type: 'new_message',
      };

      console.log(`Sending notification to ${tokens.length} recipients`);

      const result = await messaging.sendEachForMulticast({
        tokens,
        notification,
        data,
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
      });

      console.log(
        `Notifications sent: ${result.successCount} success, ${result.failureCount} failures`
      );

      if (result.failureCount > 0) {
        result.responses.forEach((response, index) => {
          if (!response.success) {
            console.error(
              `Failed to send to ${tokens[index]}:`,
              response.error
            );
          }
        });
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }
);
