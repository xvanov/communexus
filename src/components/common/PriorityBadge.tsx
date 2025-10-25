import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriorityLevel } from '../../types/AIFeatures';
import { Colors } from '../../utils/theme';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'medium',
  showLabel = true,
}) => {
  const getPriorityColor = (): string => {
    switch (priority) {
      case 'high':
        return Colors.error; // Red
      case 'medium':
        return Colors.warning; // Orange
      case 'low':
        return Colors.primary; // Blue (changed from green)
      default:
        return Colors.textSecondary; // Gray
    }
  };

  const getPriorityIcon = (): string => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵'; // Blue circle (changed from green)
      default:
        return '⚪';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
        };
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getPriorityColor() },
        getSizeStyles(),
      ]}
    >
      <Text style={[styles.text, { fontSize: getTextSize() }]}>
        {showLabel
          ? `${getPriorityIcon()} ${priority.toUpperCase()}`
          : getPriorityIcon()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
