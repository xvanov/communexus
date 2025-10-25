import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { Colors } from '../../utils/theme';

interface ConnectionStatusProps {
  onRetryAll?: () => void;
  onSync?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  onRetryAll,
  onSync,
}) => {
  const {
    isOnline,
    isSyncing,
    pendingMessages,
    failedMessages,
    syncStats,
    error,
    retryAllFailed,
    triggerSync,
    clearError,
  } = useOfflineQueue();

  const handleRetryAll = async () => {
    try {
      await retryAllFailed();
      onRetryAll?.();
    } catch (error) {
      console.error('Error retrying all failed messages:', error);
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync();
      onSync?.();
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const getStatusColor = () => {
    if (error) return Colors.error;
    if (failedMessages.length > 0) return Colors.warning;
    if (pendingMessages.length > 0) return Colors.primary;
    if (isOnline) return Colors.success; // Blue for online
    return Colors.textSecondary;
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isSyncing) return 'Syncing...';
    if (failedMessages.length > 0) return `${failedMessages.length} failed`;
    if (pendingMessages.length > 0) return `${pendingMessages.length} pending`;
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isSyncing) return '🔄';
    if (error) return '❌';
    if (failedMessages.length > 0) return '⚠️';
    if (pendingMessages.length > 0) return '📤';
    if (isOnline) return '🟢';
    return '🔴';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor() },
          ]}
        />
        <Text style={styles.statusText}>
          {getStatusIcon()} {getStatusText()}
        </Text>

        {isSyncing && (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={styles.spinner}
          />
        )}
      </View>

      {(pendingMessages.length > 0 || failedMessages.length > 0) && (
        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>
            {pendingMessages.length > 0 && `${pendingMessages.length} pending`}
            {pendingMessages.length > 0 && failedMessages.length > 0 && ' • '}
            {failedMessages.length > 0 && `${failedMessages.length} failed`}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {(failedMessages.length > 0 || !isOnline) && (
        <View style={styles.actionsRow}>
          {failedMessages.length > 0 && (
            <TouchableOpacity
              onPress={handleRetryAll}
              style={[styles.actionButton, styles.retryButton]}
              disabled={isSyncing}
            >
              <Text style={styles.actionButtonText}>Retry All</Text>
            </TouchableOpacity>
          )}

          {!isOnline && (
            <TouchableOpacity
              onPress={handleSync}
              style={[styles.actionButton, styles.syncButton]}
              disabled={isSyncing}
            >
              <Text style={styles.actionButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {syncStats.lastSyncTime && (
        <View style={styles.syncInfoRow}>
          <Text style={styles.syncInfoText}>
            Last sync: {syncStats.lastSyncTime.toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 6,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
  detailsRow: {
    marginBottom: 4,
  },
  detailsText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 16,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
    fontSize: 12,
    marginLeft: 16,
  },
  retryButton: {
    backgroundColor: '#FF9500',
  },
  spinner: {
    marginLeft: 8,
  },
  statusIndicator: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusText: {
    color: '#000000',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  syncInfoRow: {
    marginTop: 4,
  },
  syncInfoText: {
    color: '#8E8E93',
    fontSize: 10,
    marginLeft: 16,
  },
});
