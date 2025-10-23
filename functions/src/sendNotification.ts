// sendNotification.ts - Push notification Cloud Function (FCM Option A)
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

setGlobalOptions({ region: 'us-central1' });
if (getAdminApps().length === 0) {
  initializeAdminApp();
}

type SendPayload = {
  token?: string;
  tokens?: string[];
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

export const sendNotification = onCall<SendPayload>(async request => {
  const { token, tokens, title, body, data } = request.data ?? {};
  const messaging = getMessaging();
  const notification =
    title || body ? { title: title ?? '', body: body ?? '' } : undefined;

  try {
    if (tokens && tokens.length > 0) {
      const res = await messaging.sendMulticast({ tokens, notification, data });
      return {
        success: true,
        multicast: {
          successCount: res.successCount,
          failureCount: res.failureCount,
        },
      };
    }
    if (token) {
      const id = await messaging.send({ token, notification, data });
      return { success: true, messageId: id };
    }
    return { success: false, error: 'No token(s) provided' };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
});
