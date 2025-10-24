// testNotifications.ts - Test notification functionality
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const testNotificationPermissions = async (): Promise<void> => {
  console.log('🧪 TEST: Starting notification permission test...');
  console.log('🧪 TEST: Platform:', Platform.OS);
  
  // Check if running on simulator
  const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS;
  if (isSimulator) {
    console.log('⚠️  TEST: Running on iOS Simulator - Push notifications will not work!');
    console.log('⚠️  TEST: Push notifications only work on real devices');
    console.log('⚠️  TEST: Local notifications will still work for testing');
  }
  
  try {
    // Check current permissions
    const { status } = await Notifications.getPermissionsAsync();
    console.log('🧪 TEST: Current permission status:', status);
    
    if (status !== 'granted') {
      console.log('🧪 TEST: Requesting permissions...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('🧪 TEST: New permission status:', newStatus);
    }
    
    // Try to get push token
    console.log('🧪 TEST: Attempting to get push token...');
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('🧪 TEST: Push token result:', token);
    
    if (isSimulator) {
      console.log('⚠️  TEST: Push token generated but will not work on simulator');
    }
    
    // Test local notification
    console.log('🧪 TEST: Testing local notification...');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification',
      },
      trigger: null,
    });
    console.log('🧪 TEST: Local notification scheduled');
    
  } catch (error) {
    console.error('🧪 TEST: Error during test:', error);
  }
};
