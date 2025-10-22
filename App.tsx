import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import AuthScreen from './src/screens/AuthScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import GroupCreateScreen from './src/screens/GroupCreateScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const Stack = createStackNavigator();

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You could add a loading screen here
  }

  if (!user) {
    return (
      <AuthScreen onAuthSuccess={() => {}} />
    );
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

