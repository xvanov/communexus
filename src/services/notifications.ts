// notifications.ts - Push notification setup and handling (client)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { initializeFirebase } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!DeviceSupportsPush()) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token ?? null;
};

export const storePushTokenForCurrentUser = async (expoPushToken: string): Promise<void> => {
  const { auth } = initializeFirebase();
  const db = (await import('./firebase')).getDb?.(false) ?? initializeFirebase().db;
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  await setDoc(doc(db as any, 'notifications', userId), { expoPushToken, updatedAt: new Date() } as any, { merge: true });
};

function DeviceSupportsPush(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
