// ChannelIcon.tsx - Channel indicator icon component
import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import type { ChannelType } from '../../types/Channel';
import { Colors } from '../../utils/theme';

interface ChannelIconProps {
  channel: ChannelType;
  size?: 'small' | 'medium' | 'large';
}

export const ChannelIcon: React.FC<ChannelIconProps> = ({
  channel,
  size = 'medium',
}) => {
  const getChannelIcon = (): string => {
    switch (channel) {
      case 'sms':
        return '📱';
      case 'messenger':
        return '💬';
      case 'email':
        return '📧';
      case 'in-app':
        return '💬';
      default:
        return '💬';
    }
  };

  const getChannelName = (): string => {
    switch (channel) {
      case 'sms':
        return 'SMS';
      case 'messenger':
        return 'Messenger';
      case 'email':
        return 'Email';
      case 'in-app':
        return 'In-App';
      default:
        return 'Unknown';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: 14,
          width: 20,
          height: 20,
        };
      case 'large':
        return {
          fontSize: 24,
          width: 32,
          height: 32,
        };
      default:
        return {
          fontSize: 18,
          width: 24,
          height: 24,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[styles.container, { width: sizeStyles.width, height: sizeStyles.height }]}
      accessible={true}
      accessibilityLabel={`${getChannelName()} channel`}
      accessibilityRole="image"
      testID={`channel-icon-${channel}`}
    >
      <Text style={[styles.icon, { fontSize: sizeStyles.fontSize }]}>
        {getChannelIcon()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});







