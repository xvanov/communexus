// notifications.ts - Push notification setup and handling (client)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { initializeFirebase, getDb } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  messageNotifications: boolean;
  mentionNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  showPreview: true,
  messageNotifications: true,
  mentionNotifications: true,
};

/**
 * Request notification permissions from the user
 * @returns Expo push token if granted, null otherwise
 */
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  console.log('🔔 Starting notification permission request...');

  if (!deviceSupportsPush()) {
    console.log('❌ Device does not support push notifications');
    console.log(
      '📱 This is expected in Expo Go - push notifications are not supported'
    );
    console.log('📱 Local notifications will still work for testing');
    return null;
  }

  console.log('📋 Checking existing permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('📋 Current permission status:', existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('🔔 Requesting new permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('📋 New permission status:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Notification permissions not granted');
    return null;
  }

  console.log('✅ Notification permissions granted');

  try {
    console.log('🔑 Generating Expo push token...');
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('📱 Expo push token generated:', token);
    return token ?? null;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
};

/**
 * Store push token for the current user in Firestore
 * @param expoPushToken - Expo push token to store
 */
export const storePushTokenForCurrentUser = async (
  expoPushToken: string
): Promise<void> => {
  const { auth } = initializeFirebase();
  const db = getDb(true);
  const userId = auth.currentUser?.uid;

  if (!userId) throw new Error('Not authenticated');

  await setDoc(
    doc(db, 'users', userId),
    {
      expoPushToken,
      pushTokenUpdatedAt: new Date(),
      platform: Platform.OS,
    },
    { merge: true }
  );

  console.log('💾 Push token stored successfully for user:', userId);
};

/**
 * Initialize notification system for the current user
 * Requests permissions and stores token
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    const token = await requestNotificationPermission();
    if (token) {
      await storePushTokenForCurrentUser(token);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

/**
 * Get notification preferences for the current user
 * @returns User's notification preferences or defaults
 */
export const getNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    const { auth } = initializeFirebase();
    const db = getDb(true);
    const userId = auth.currentUser?.uid;

    if (!userId) return DEFAULT_PREFERENCES;

    try {
      const prefsDoc = await getDoc(doc(db, 'notificationPreferences', userId));
      if (prefsDoc.exists()) {
        return {
          ...DEFAULT_PREFERENCES,
          ...prefsDoc.data(),
        } as NotificationPreferences;
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  };

/**
 * Update notification preferences for the current user
 * @param preferences - Partial preferences to update
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  const { auth } = initializeFirebase();
  const db = getDb(true);
  const userId = auth.currentUser?.uid;

  if (!userId) throw new Error('Not authenticated');

  await setDoc(
    doc(db, 'notificationPreferences', userId),
    { ...preferences, updatedAt: new Date() },
    { merge: true }
  );

  console.log('Notification preferences updated');
};

/**
 * Set up listeners for incoming notifications
 * @param onNotificationReceived - Callback for foreground notifications
 * @param onNotificationTapped - Callback for notification interactions
 * @returns Cleanup function to remove listeners
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): (() => void) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      onNotificationTapped?.(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

/**
 * Schedule a local notification (for testing/development)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
    },
    trigger: null, // null means immediate
  });
};

/**
 * Clear all delivered notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Set the app badge count (iOS)
 * @param count - Badge number to display
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
};

/**
 * Get current badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  if (Platform.OS === 'ios') {
    return await Notifications.getBadgeCountAsync();
  }
  return 0;
};

/**
 * Check if device supports push notifications
 */
function deviceSupportsPush(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Calculate total unread count from threads for a specific user
 * @param threads - Array of threads with per-user unread counts
 * @param userId - User ID to calculate unread count for
 * @returns Total unread count for the user
 */
export const calculateTotalUnreadCount = (
  threads: Array<{ unreadCount?: Record<string, number> }>,
  userId: string
): number => {
  return threads.reduce((total, thread) => {
    const userUnreadCount = thread.unreadCount?.[userId] || 0;
    return total + userUnreadCount;
  }, 0);
};

/**
 * Update badge count based on unread messages
 * @param unreadCount - Total unread count
 */
export const updateBadgeFromUnreadCount = async (
  unreadCount: number
): Promise<void> => {
  await setBadgeCount(unreadCount);
};
