import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDetails = false,
}) => {
  const { isOnline, stats, isSyncing } = useOfflineQueue();

  // Use useMemo to create the Animated.Value only once
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, fadeAnim]);

  if (isOnline) {
    return null;
  }

  const getMessageCount = () => {
    const total = stats.pendingMessages + stats.failedMessages;
    if (total === 0) return '';
    return ` (${total})`;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (stats.failedMessages > 0)
      return `Offline - ${stats.failedMessages} failed${getMessageCount()}`;
    if (stats.pendingMessages > 0)
      return `Offline - ${stats.pendingMessages} pending${getMessageCount()}`;
    return 'Offline';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { opacity: fadeAnim },
      ]}
      testID="offline-indicator"
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📡</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {showDetails && (
            <Text style={styles.detailsText}>
              Messages will be sent when connection is restored
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomPosition: {
    bottom: 0,
  },
  container: {
    backgroundColor: '#FF9500',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  icon: {
    fontSize: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
  },
  topPosition: {
    top: 0,
  },
});
