// DirectionIndicator.tsx - Direction indicator component
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChannelType } from '../../types/Channel';
import { useLookupIdentity } from '../../hooks/useIdentity';
import { Colors, Spacing } from '../../utils/theme';

interface DirectionIndicatorProps {
  direction: 'incoming' | 'outgoing';
  channel: ChannelType;
  identifier: string;
  organizationId?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Format phone number from E.164 format to display format
 * @param phoneNumber - Phone number in E.164 format (e.g., '+15551234567')
 * @returns Formatted phone number (e.g., '(555) 123-4567')
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // E.164 format: +[country code][number]
  // Example: +15551234567 -> (555) 123-4567
  const match = phoneNumber.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  // If not US format, return as-is
  return phoneNumber;
};

/**
 * Format identifier for display based on channel type
 * @param identifier - The identifier to format
 * @param channel - The channel type
 * @returns Formatted identifier string
 */
const formatIdentifier = (identifier: string, channel: ChannelType): string => {
  switch (channel) {
    case 'sms':
      // Format phone number from E.164 to display format
      return formatPhoneNumber(identifier);
    case 'email':
      // Email addresses are already in readable format
      return identifier;
    case 'messenger':
      // Facebook IDs are less readable, show as-is
      return identifier;
    case 'in-app':
      // User IDs can be shown as-is or formatted
      return identifier;
    default:
      return identifier;
  }
};

/**
 * Get channel display name
 * @param channel - The channel type
 * @returns Display name for the channel
 */
const getChannelDisplayName = (channel: ChannelType): string => {
  switch (channel) {
    case 'sms':
      return 'Phone';
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

export const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({
  direction,
  channel,
  identifier,
  organizationId,
  size = 'medium',
}) => {
  const { lookupByIdentifier, loading } = useLookupIdentity();
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  useEffect(() => {
    // Try to resolve identifier to user name if organizationId is provided
    if (organizationId && identifier) {
      lookupByIdentifier(identifier, organizationId)
        .then(result => {
          if (result?.identityLink) {
            // Use the external identity type to determine display
            // For now, we'll show the identifier formatted
            // In the future, we could show the linked user's name
            setResolvedName(null); // Keep identifier for now
          }
        })
        .catch(error => {
          console.error('Error resolving identifier:', error);
        });
    }
  }, [identifier, organizationId, lookupByIdentifier]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: 10,
          paddingHorizontal: 4,
          paddingVertical: 2,
        };
      case 'large':
        return {
          fontSize: 14,
          paddingHorizontal: 8,
          paddingVertical: 4,
        };
      default:
        return {
          fontSize: 12,
          paddingHorizontal: 6,
          paddingVertical: 3,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const formattedIdentifier = formatIdentifier(identifier, channel);
  const channelName = getChannelDisplayName(channel);
  const displayText = direction === 'incoming'
    ? `Incoming from [${channelName}: ${formattedIdentifier}]`
    : `Outgoing to [${channelName}: ${formattedIdentifier}]`;

  return (
    <View
      style={[styles.container, sizeStyles]}
      accessible={true}
      accessibilityLabel={displayText}
      accessibilityRole="text"
      testID={`direction-indicator-${direction}-${channel}`}
    >
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
  },
  text: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});








