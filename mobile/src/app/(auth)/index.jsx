import { useAuth } from '@/utils/auth/useAuth';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#007AFF',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingHorizontal: 24 
    }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingBottom: 60 
      }}>
        <View style={{
          width: 100,
          height: 100,
          backgroundColor: 'white',
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Text style={{ fontSize: 40, color: '#007AFF' }}>💬</Text>
        </View>
        
        <Text style={{ 
          fontSize: 36, 
          fontWeight: 'bold', 
          color: 'white', 
          marginBottom: 12,
          textAlign: 'center' 
        }}>
          Communexus
        </Text>
        
        <Text style={{ 
          fontSize: 18, 
          color: 'rgba(255, 255, 255, 0.8)', 
          textAlign: 'center',
          lineHeight: 24,
          paddingHorizontal: 20
        }}>
          Reliable messaging for small business operators
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={() => signUp()}
          style={{
            backgroundColor: 'white',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}
        >
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: '#007AFF',
            textAlign: 'center' 
          }}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => signIn()}
          style={{
            backgroundColor: 'transparent',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }}
        >
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '500', 
            color: 'white',
            textAlign: 'center' 
          }}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}