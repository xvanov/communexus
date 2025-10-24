import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDetails = false
}) => {
  const { isOnline, pendingMessages, failedMessages, isSyncing } = useOfflineQueue();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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
    const total = pendingMessages.length + failedMessages.length;
    if (total === 0) return '';
    return ` (${total})`;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (failedMessages.length > 0) return `Offline - ${failedMessages.length} failed${getMessageCount()}`;
    if (pendingMessages.length > 0) return `Offline - ${pendingMessages.length} pending${getMessageCount()}`;
    return 'Offline';
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { opacity: fadeAnim }
      ]}
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
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FF9500',
    zIndex: 1000,
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF9500',
  },
  iconContainer: {
    marginRight: 8,
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
});
