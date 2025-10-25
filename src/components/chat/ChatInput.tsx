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
import { Colors, Spacing, BorderRadius } from '../../utils/theme';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Message',
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
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          multiline
          maxLength={maxLength}
          editable={!sending && !disabled}
          testID="message-input"
        />
      </View>
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!inputText.trim() || sending || disabled) &&
            styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!inputText.trim() || sending || disabled}
        activeOpacity={0.7}
        testID="send-button"
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        ) : (
          <Text style={styles.sendButtonText}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  inputWrapper: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.xl,
    flex: 1,
    marginRight: Spacing.sm,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  textInput: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
