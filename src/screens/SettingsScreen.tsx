// SettingsScreen.tsx - User profile, logout, and app settings
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  clearAllNotifications,
  scheduleLocalNotification,
  type NotificationPreferences,
} from '../services/notifications';

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    sound: true,
    vibration: true,
    showPreview: true,
    messageNotifications: true,
    mentionNotifications: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      await updateNotificationPreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
      // Revert on error
      await loadPreferences();
    }
  };

  const handleTestNotification = async () => {
    try {
      await scheduleLocalNotification(
        'Test Notification',
        'This is a test notification',
        { test: true }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearAllNotifications();
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive push notifications for new messages
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={value => updatePreference('enabled', value)}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={preferences.enabled ? '#1E3A8A' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Text style={styles.settingDescription}>
              Play sound for notifications
            </Text>
          </View>
          <Switch
            value={preferences.sound}
            onValueChange={value => updatePreference('sound', value)}
            disabled={!preferences.enabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={preferences.sound ? '#1E3A8A' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>
              Vibrate on new notifications
            </Text>
          </View>
          <Switch
            value={preferences.vibration}
            onValueChange={value => updatePreference('vibration', value)}
            disabled={!preferences.enabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={preferences.vibration ? '#1E3A8A' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Preview</Text>
            <Text style={styles.settingDescription}>
              Show message preview in notifications
            </Text>
          </View>
          <Switch
            value={preferences.showPreview}
            onValueChange={value => updatePreference('showPreview', value)}
            disabled={!preferences.enabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={preferences.showPreview ? '#1E3A8A' : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Message Notifications</Text>
            <Text style={styles.settingDescription}>
              Notify for all new messages
            </Text>
          </View>
          <Switch
            value={preferences.messageNotifications}
            onValueChange={value =>
              updatePreference('messageNotifications', value)
            }
            disabled={!preferences.enabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={
              preferences.messageNotifications ? '#1E3A8A' : '#f4f3f4'
            }
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Mention Notifications</Text>
            <Text style={styles.settingDescription}>
              Notify when you are mentioned (@you)
            </Text>
          </View>
          <Switch
            value={preferences.mentionNotifications}
            onValueChange={value =>
              updatePreference('mentionNotifications', value)
            }
            disabled={!preferences.enabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={
              preferences.mentionNotifications ? '#1E3A8A' : '#f4f3f4'
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestNotification}
        >
          <Text style={styles.actionButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleClearNotifications}
        >
          <Text style={styles.actionButtonTextSecondary}>
            Clear All Notifications
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Built with React Native & Firebase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginTop: 12,
    padding: 16,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  divider: {
    backgroundColor: '#334155',
    height: 1,
    marginVertical: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  footerSubtext: {
    color: '#64748B',
    fontSize: 12,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 50,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingDescription: {
    color: '#94A3B8',
    fontSize: 13,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
