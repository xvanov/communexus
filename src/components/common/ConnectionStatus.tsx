import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

interface ConnectionStatusProps {
  onRetryAll?: () => void;
  onSync?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  onRetryAll,
  onSync
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
    clearError
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
    if (error) return '#FF3B30';
    if (failedMessages.length > 0) return '#FF9500';
    if (pendingMessages.length > 0) return '#007AFF';
    if (isOnline) return '#34C759';
    return '#8E8E93';
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
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusIcon()} {getStatusText()}</Text>
        
        {isSyncing && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} />
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
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  spinner: {
    marginLeft: 8,
  },
  detailsRow: {
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
    marginLeft: 16,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF9500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncInfoRow: {
    marginTop: 4,
  },
  syncInfoText: {
    fontSize: 10,
    color: '#8E8E93',
    marginLeft: 16,
  },
});
