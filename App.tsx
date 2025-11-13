import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuth } from './src/hooks/useAuth';
import {
  initializeNotifications,
  setupNotificationListeners,
} from './src/services/notifications';
import AuthScreen from './src/screens/AuthScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import GroupCreateScreen from './src/screens/GroupCreateScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChecklistsScreen from './src/screens/ChecklistsScreen';

const Stack = createStackNavigator();

export default function App() {
  const { user, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Suppress Firebase warnings and errors in console during development/testing
    // This prevents error overlays from blocking automated tests

    if (__DEV__) {
      LogBox.ignoreAllLogs(true);
    }

    // Global error handler to prevent unhandled errors from showing alerts
    const errorHandler = (error: Error, isFatal?: boolean) => {
      const errorMessage = error?.message || String(error);
      
      // Handle NativeEventEmitter errors from voice library (non-fatal - voice just won't work)
      if (errorMessage.includes('NativeEventEmitter') || 
          errorMessage.includes('requires a non-null argument')) {
        console.log('⚠️ Voice module not linked - voice features disabled. Rebuild app to enable: npx expo prebuild --platform ios && npx expo run:ios');
        // Make this non-fatal - app can continue without voice
        return;
      }
      
      console.error('Global error caught:', error, 'Fatal:', isFatal);
      // Don't show alerts - just log to console
    };

    // Note: ErrorUtils is available in React Native but not in TypeScript types
    // @ts-expect-error - ErrorUtils exists in React Native runtime
    if (global.ErrorUtils) {
      // @ts-expect-error - setGlobalHandler exists but not in types
      global.ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      if (__DEV__) {
        LogBox.ignoreAllLogs(false);
      }
    };
  }, []);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      initializeNotifications().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      // On foreground notification received
      notification => {
        console.log('Foreground notification:', notification);
        // Notification is automatically displayed by the handler
      },
      // On notification tapped
      response => {
        console.log('Notification tapped:', response);
        // Handle deep linking
        const data = response.notification.request.content.data;
        if (data?.threadId && navigationRef.current) {
          navigationRef.current.navigate('Chat', { threadId: data.threadId });
        }
      }
    );

    return cleanup;
  }, []);

  if (loading) {
    return null; // You could add a loading screen here
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="ChatList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Chat' }}
        />
        <Stack.Screen
          name="GroupCreate"
          component={GroupCreateScreen}
          options={{ title: 'Create Thread' }}
        />
        <Stack.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{ title: 'Contacts' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Checklists"
          component={ChecklistsScreen}
          options={{ title: 'Checklists' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
