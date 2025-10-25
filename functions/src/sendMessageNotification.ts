// sendMessageNotification.ts - Auto-send notifications when messages are created
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
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
    console.log('🔥 sendMessageNotification triggered!', {
      threadId: event.params.threadId,
      messageId: event.params.messageId,
    });

    const snapshot = event.data;
    if (!snapshot) {
      console.log('❌ No data in snapshot');
      return;
    }

    const messageData = snapshot.data();
    const threadId = event.params.threadId;
    const senderId = messageData.senderId;
    const senderName = messageData.senderName;
    const messageText = messageData.text;

    console.log('📨 Message data:', {
      threadId,
      senderId,
      senderName,
      messageText: messageText?.substring(0, 50) + '...',
      messageId: snapshot.id,
    });

    try {
      // Get thread to find participants
      const db = getFirestore();
      const threadDoc = await db.doc(`threads/${threadId}`).get();

      if (!threadDoc.exists) {
        console.log('❌ Thread not found:', threadId);
        return;
      }

      const threadData = threadDoc.data();
      const participants = threadData?.participants || [];

      console.log('👥 Thread participants:', participants);

      // Get push tokens for all participants except the sender
      const recipientIds = participants.filter((id: string) => id !== senderId);

      console.log('📤 Recipients to notify:', recipientIds);

      if (recipientIds.length === 0) {
        console.log('❌ No recipients to notify');
        return;
      }

      // Fetch user documents to get push tokens and preferences
      const userDocs = await Promise.all(
        recipientIds.map((id: string) => db.doc(`users/${id}`).get())
      );

      const tokens: string[] = [];
      for (const userDoc of userDocs) {
        if (!userDoc.exists) {
          console.log('❌ User document not found:', userDoc.id);
          continue;
        }

        const userData = userDoc.data();
        const pushToken = userData?.expoPushToken;

        console.log(
          '👤 User:',
          userDoc.id,
          'Push token:',
          pushToken ? '✅' : '❌'
        );

        if (pushToken) {
          // Check notification preferences
          const prefsDoc = await db
            .doc(`notificationPreferences/${userDoc.id}`)
            .get();
          const prefs = prefsDoc.exists ? prefsDoc.data() : {};

          console.log('🔔 User preferences:', userDoc.id, prefs);

          // Only send if notifications are enabled
          if (
            prefs?.enabled !== false &&
            prefs?.messageNotifications !== false
          ) {
            tokens.push(pushToken);
            console.log('✅ Added token for user:', userDoc.id);
          } else {
            console.log('❌ Notifications disabled for user:', userDoc.id);
          }
        }
      }

      if (tokens.length === 0) {
        console.log('No valid push tokens found');
        return;
      }

      // Send notification to all recipients using Expo Push API
      console.log(`Sending notification to ${tokens.length} recipients`);

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: senderName,
        body: messageText.substring(0, 100), // Limit message length
        data: {
          threadId,
          senderId,
          messageId: snapshot.id,
          type: 'new_message',
        },
        badge: 1,
      }));

      try {
        const response = await globalThis.fetch(
          'https://exp.host/--/api/v2/push/send',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
          }
        );

        const result = (await response.json()) as {
          data?: Array<{ status: string }>;
        };
        console.log('Expo push notification result:', result);

        if (result.data) {
          const successCount = result.data.filter(
            (receipt: { status: string }) => receipt.status === 'ok'
          ).length;
          const failureCount = result.data.filter(
            (receipt: { status: string }) => receipt.status !== 'ok'
          ).length;

          console.log(
            `Notifications sent: ${successCount} success, ${failureCount} failures`
          );

          if (failureCount > 0) {
            result.data.forEach(
              (receipt: { status: string }, index: number) => {
                if (receipt.status !== 'ok') {
                  console.error(`Failed to send to ${tokens[index]}:`, receipt);
                }
              }
            );
          }
        }
      } catch (error) {
        console.error('Error sending Expo push notifications:', error);
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }
);
