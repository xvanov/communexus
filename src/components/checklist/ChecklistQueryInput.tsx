// ChecklistQueryInput.tsx - Query input component for checklist status queries
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { checklistQueryService, QueryResult } from '../../services/checklistQueryService';

interface ChecklistQueryInputProps {
  checklistId: string;
  onQueryResult: (result: QueryResult) => void;
  onError?: (error: string) => void;
}

export const ChecklistQueryInput: React.FC<ChecklistQueryInputProps> = ({
  checklistId,
  onQueryResult,
  onError,
}) => {
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  // Check if voice library is available
  useEffect(() => {
    const checkVoiceAvailability = async () => {
      try {
        // Try to import voice library
        const Voice = await import('@react-native-voice/voice');
        if (Voice.default) {
          // Check if native module is actually available
          // This will throw if native module isn't linked
          try {
            // Test if we can access the module (this will fail if native code isn't linked)
            if (typeof Voice.default.start === 'function') {
              setVoiceAvailable(true);
              
              // Set up voice event listeners
              Voice.default.onSpeechStart = () => {
                setIsRecording(true);
              };
              
              Voice.default.onSpeechEnd = () => {
                setIsRecording(false);
              };
              
              Voice.default.onSpeechResults = (e: any) => {
                if (e.value && e.value.length > 0) {
                  setTranscription(e.value[0]);
                  setText(e.value[0]);
                }
              };
              
              Voice.default.onSpeechError = (e: any) => {
                console.error('Speech recognition error:', e);
                setIsRecording(false);
                if (onError) {
                  onError('Speech recognition failed. Please try typing instead.');
                }
              };
            } else {
              setVoiceAvailable(false);
            }
          } catch (nativeError: any) {
            // Native module not linked - need to rebuild app
            console.log('Voice native module not available - rebuild required:', nativeError?.message || nativeError);
            setVoiceAvailable(false);
          }
        } else {
          setVoiceAvailable(false);
        }
      } catch (error: any) {
        // Voice library not installed or native module error - voice features will be disabled
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes('NativeEventEmitter') || errorMsg.includes('requires a non-null argument')) {
          console.log('Voice native module not linked - please rebuild app with: npx expo prebuild --platform ios && npx expo run:ios');
        } else {
          console.log('Voice library not available:', errorMsg);
        }
        setVoiceAvailable(false);
      }
    };

    checkVoiceAvailability();
  }, [onError]);

  const handleProcessQuery = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      setProcessing(true);
      const result = await checklistQueryService.processChecklistQuery(
        text.trim(),
        checklistId
      );
      
      setProcessing(false);
      onQueryResult(result);
      setText(''); // Clear input after processing
      setTranscription(null);
    } catch (error) {
      setProcessing(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process query. Please try again.';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleStartRecording = async () => {
    if (!voiceAvailable) {
      Alert.alert(
        'Voice Input Not Available',
        'Please install @react-native-voice/voice to use voice input. For now, please type your query.'
      );
      return;
    }

    try {
      const Voice = await import('@react-native-voice/voice');
      await Voice.default.start('en-US');
      setIsRecording(true);
      setTranscription(null);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check microphone permissions.'
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      const Voice = await import('@react-native-voice/voice');
      await Voice.default.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      setIsRecording(false);
    }
  };

  const handleVoiceButtonPress = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <View style={styles.container} testID="checklist-query-input">
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about checklist status... (e.g., 'what's next?', 'show incomplete')"
          placeholderTextColor="#8E8E93"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleProcessQuery}
          editable={!processing}
          testID="query-text-input"
        />
        {voiceAvailable && (
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
            onPress={handleVoiceButtonPress}
            disabled={processing}
            testID="voice-button"
          >
            <Text style={styles.voiceButtonText}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || processing) && styles.sendButtonDisabled]}
          onPress={handleProcessQuery}
          disabled={!text.trim() || processing}
          testID="send-query-button"
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
      {transcription && (
        <Text style={styles.transcriptionText} testID="transcription-text">
          Transcribed: {transcription}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    fontSize: 20,
  },
  sendButton: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  transcriptionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});

