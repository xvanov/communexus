import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from './src/services/firebase';
import AuthScreen from './src/screens/AuthScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import GroupCreateScreen from './src/screens/GroupCreateScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="ChatList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
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

