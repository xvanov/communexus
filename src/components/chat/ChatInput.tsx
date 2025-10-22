// ChatInput.tsx - Reusable chat input component
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
}) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || sending || disabled) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await onSendMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputText(text); // Restore the text on error
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={setInputText}
        placeholder={placeholder}
        multiline
        maxLength={maxLength}
        editable={!sending && !disabled}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!inputText.trim() || sending || disabled) &&
            styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!inputText.trim() || sending || disabled}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.sendButtonText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
