import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

export default function App() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testFirebaseFunction = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://us-central1-communexus.cloudfunctions.net/helloWorld',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: {} }),
        }
      );

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      Alert.alert('Success!', 'Firebase function called successfully!');
    } catch (error) {
      setResult(`Error: ${error}`);
      Alert.alert('Error', 'Failed to call Firebase function');
    } finally {
      setLoading(false);
    }
  };

  const testLocalEmulator = async () => {
    setLoading(true);
    try {
      // Test local emulator (your computer's IP)
      const response = await fetch(
        'http://10.110.1.169:5001/communexus/us-central1/helloWorld',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: {} }),
        }
      );

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      Alert.alert('Success!', 'Local emulator function called successfully!');
    } catch (error) {
      setResult(`Error: ${error}`);
      Alert.alert(
        'Error',
        'Failed to call local emulator. Make sure your phone is on the same network and emulator is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔥 Communexus Firebase Test</Text>
        <Text style={styles.subtitle}>Test your Firebase Cloud Functions</Text>

        <TouchableOpacity
          style={[styles.button, styles.productionButton]}
          onPress={testFirebaseFunction}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : '🚀 Test Production Function'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.localButton]}
          onPress={testLocalEmulator}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : '🏠 Test Local Emulator'}
          </Text>
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>📋 Result:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Instructions:</Text>
          <Text style={styles.infoText}>
            1. Tap "Test Production Function" to test the deployed Firebase
            function{'\n'}
            2. Tap "Test Local Emulator" to test the local emulator (requires
            same WiFi network){'\n'}
            3. Check the result below
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    lineHeight: 20,
  },
  infoTitle: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  localButton: {
    backgroundColor: '#34C759',
  },
  productionButton: {
    backgroundColor: '#007AFF',
  },
  resultContainer: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  resultText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  resultTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});
