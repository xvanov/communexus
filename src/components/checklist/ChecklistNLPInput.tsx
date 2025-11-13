// ChecklistNLPInput.tsx - Natural language input component for checklist commands
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
import { checklistNLPService, CommandPreview } from '../../services/checklistNLPService';

interface ChecklistNLPInputProps {
  checklistId: string;
  items: Array<{ id: string; title: string; status: string; order: number }>;
  onCommandPreview: (preview: CommandPreview) => void;
  onError?: (error: string) => void;
}

export const ChecklistNLPInput: React.FC<ChecklistNLPInputProps> = ({
  checklistId,
  items,
  onCommandPreview,
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

  const handleProcessCommand = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      setProcessing(true);
      const preview = await checklistNLPService.processChecklistCommand(
        text.trim(),
        checklistId,
        items
      );
      
      setProcessing(false);
      onCommandPreview(preview);
      setText(''); // Clear input after processing
      setTranscription(null);
    } catch (error) {
      setProcessing(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process command. Please try again.';
      
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
        'Please install @react-native-voice/voice to use voice input. For now, please type your command.'
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
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          testID="checklist-nlp-input"
          style={styles.input}
          placeholder="Type or speak a command (e.g., 'mark item 3 complete', 'add new task: install tiles')"
          value={text}
          onChangeText={setText}
          placeholderTextColor="#8E8E93"
          editable={!processing && !isRecording}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          testID="voice-input-button"
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonRecording,
            !voiceAvailable && styles.voiceButtonDisabled,
          ]}
          onPress={handleVoiceButtonPress}
          disabled={processing || !voiceAvailable}
        >
          {isRecording ? (
            <Text style={styles.voiceButtonText}>⏹</Text>
          ) : (
            <Text style={styles.voiceButtonText}>🎤</Text>
          )}
        </TouchableOpacity>
      </View>

      {transcription && (
        <Text style={styles.transcriptionText}>
          Heard: "{transcription}"
        </Text>
      )}

      {processing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.processingText}>Processing command...</Text>
        </View>
      )}

      <TouchableOpacity
        testID="process-command-button"
        style={[
          styles.submitButton,
          (!text.trim() || processing || isRecording) && styles.submitButtonDisabled,
        ]}
        onPress={handleProcessCommand}
        disabled={!text.trim() || processing || isRecording}
      >
        <Text style={styles.submitButtonText}>
          {processing ? 'Processing...' : 'Process Command'}
        </Text>
      </TouchableOpacity>
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 44,
    maxHeight: 100,
    marginRight: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.5,
  },
  voiceButtonText: {
    fontSize: 20,
  },
  transcriptionText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

