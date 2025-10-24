// testPushNotifications.ts - Test push notification flow
import { getDb } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const testPushNotificationFlow = async (): Promise<void> => {
  console.log('🧪 PUSH TEST: Testing push notification flow...');

  const db = await getDb();

  // Simulate a push token (what would be generated on a real device)
  const simulatedToken = 'ExponentPushToken[TEST_TOKEN_FOR_SIMULATOR]';

  try {
    // Get current user
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ PUSH TEST: No current user');
      return;
    }

    console.log('🧪 PUSH TEST: Current user:', currentUser.email);

    // Store a simulated push token
    await setDoc(
      doc(db, 'users', currentUser.uid),
      {
        expoPushToken: simulatedToken,
        pushTokenUpdatedAt: new Date(),
        platform: 'ios',
      },
      { merge: true }
    );

    console.log('✅ PUSH TEST: Simulated push token stored');

    // Check if we can find the token
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();

    console.log('🧪 PUSH TEST: User document data:', {
      hasToken: !!userData?.expoPushToken,
      token: userData?.expoPushToken,
      platform: userData?.platform,
    });

    console.log('✅ PUSH TEST: Push notification flow test complete');
    console.log('📝 PUSH TEST: On a real device, this token would be valid');
    console.log(
      '📝 PUSH TEST: Cloud Function would use this token to send notifications'
    );
  } catch (error) {
    console.error('❌ PUSH TEST: Error during test:', error);
  }
};
