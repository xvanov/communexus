import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { useAuth } from './src/hooks/useAuth';
import AuthScreen from './src/screens/AuthScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import GroupCreateScreen from './src/screens/GroupCreateScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const Stack = createStackNavigator();

export default function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Suppress Firebase warnings and errors in console during development/testing
    // This prevents error overlays from blocking automated tests
    // eslint-disable-next-line no-undef
    if (__DEV__) {
      LogBox.ignoreAllLogs(true);
    }

    // Global error handler to prevent unhandled errors from showing alerts
    const errorHandler = (error: Error, isFatal?: boolean) => {
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
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        LogBox.ignoreAllLogs(false);
      }
    };
  }, []);

  if (loading) {
    return null; // You could add a loading screen here
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <NavigationContainer>
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
          options={{ title: 'Communexus' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
