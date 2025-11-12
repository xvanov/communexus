// ChannelBadge.tsx - Channel badge component combining icon and direction indicator
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ChannelType } from '../../types/Channel';
import { ChannelIcon } from './ChannelIcon';
import { DirectionIndicator } from './DirectionIndicator';
import { Colors, Spacing } from '../../utils/theme';

interface ChannelBadgeProps {
  channel: ChannelType;
  direction: 'incoming' | 'outgoing';
  identifier: string;
  organizationId?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showDirection?: boolean;
}

/**
 * ChannelBadge component that combines ChannelIcon and DirectionIndicator
 * into a badge format for displaying channel information in messages.
 * 
 * Note: This is a basic version. Full channel badge implementation will be in Story 1.7.
 */
export const ChannelBadge: React.FC<ChannelBadgeProps> = ({
  channel,
  direction,
  identifier,
  organizationId,
  size = 'medium',
  showIcon = true,
  showDirection = true,
}) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      testID={`channel-badge-${channel}-${direction}`}
    >
      {showIcon && (
        <View style={styles.iconContainer}>
          <ChannelIcon channel={channel} size={size} />
        </View>
      )}
      {showDirection && (
        <View style={styles.directionContainer}>
          <DirectionIndicator
            direction={direction}
            channel={channel}
            identifier={identifier}
            organizationId={organizationId}
            size={size}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  directionContainer: {
    flex: 1,
  },
});







