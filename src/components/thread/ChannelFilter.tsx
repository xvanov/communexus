// ChannelFilter.tsx - Channel filter component for filtering messages by channel
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ChannelType } from '../../types/Channel';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';

interface ChannelFilterProps {
  selectedChannel: ChannelType | 'all';
  onChannelSelect: (channel: ChannelType | 'all') => void;
  availableChannels?: ChannelType[];
}

const ALL_CHANNELS: ChannelType[] = ['sms', 'messenger', 'email', 'in-app'];

/**
 * ChannelFilter component for filtering messages by channel
 * Displays filter buttons for each channel type (SMS, Messenger, Email, In-App, All)
 * and allows users to filter messages in a thread view.
 */
export const ChannelFilter: React.FC<ChannelFilterProps> = ({
  selectedChannel,
  onChannelSelect,
  availableChannels = ALL_CHANNELS,
}) => {
  const getChannelDisplayName = (channel: ChannelType | 'all'): string => {
    switch (channel) {
      case 'sms':
        return 'SMS';
      case 'messenger':
        return 'Messenger';
      case 'email':
        return 'Email';
      case 'in-app':
        return 'In-App';
      case 'all':
        return 'All';
      default:
        return 'Unknown';
    }
  };

  const channels: (ChannelType | 'all')[] = ['all', ...availableChannels];

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Channel filter"
      testID="channel-filter"
    >
      {channels.map(channel => {
        const isSelected = selectedChannel === channel;
        return (
          <TouchableOpacity
            key={channel}
            style={[
              styles.filterButton,
              isSelected && styles.filterButtonSelected,
            ]}
            onPress={() => onChannelSelect(channel)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter by ${getChannelDisplayName(channel)}`}
            testID={`channel-filter-${channel}`}
          >
            <Text
              style={[
                styles.filterButtonText,
                isSelected && styles.filterButtonTextSelected,
              ]}
            >
              {getChannelDisplayName(channel)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});








