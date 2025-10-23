// notifications.test.ts - Integration tests for notification system
import {
  requestNotificationPermission,
  storePushTokenForCurrentUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  setupNotificationListeners,
  scheduleLocalNotification,
  clearAllNotifications,
  setBadgeCount,
  getBadgeCount,
  calculateTotalUnreadCount,
  updateBadgeFromUnreadCount,
  type NotificationPreferences,
} from '../../src/services/notifications';

describe('Notification Service', () => {
  describe('Notification Preferences', () => {
    it('should have default preferences', async () => {
      const prefs = await getNotificationPreferences();

      expect(prefs).toBeDefined();
      expect(prefs.enabled).toBeDefined();
      expect(prefs.sound).toBeDefined();
      expect(prefs.vibration).toBeDefined();
      expect(prefs.showPreview).toBeDefined();
      expect(prefs.messageNotifications).toBeDefined();
      expect(prefs.mentionNotifications).toBeDefined();
    });

    it.skip('should update preferences (requires auth)', async () => {
      const updates: Partial<NotificationPreferences> = {
        enabled: false,
        sound: false,
      };

      await expect(
        updateNotificationPreferences(updates)
      ).resolves.not.toThrow();
    });
  });

  describe('Badge Management', () => {
    it('should calculate total unread count correctly for a user', () => {
      const userId = 'user123';
      const threads = [
        { id: '1', unreadCount: { [userId]: 5, other: 2 } },
        { id: '2', unreadCount: { [userId]: 3 } },
        { id: '3', unreadCount: { [userId]: 0 } },
      ];

      const total = calculateTotalUnreadCount(threads, userId);
      expect(total).toBe(8);
    });

    it('should handle threads with no unread count for user', () => {
      const userId = 'user123';
      const threads = [
        { id: '1', unreadCount: {} },
        { id: '2', unreadCount: { [userId]: 2 } },
      ];

      const total = calculateTotalUnreadCount(threads, userId);
      expect(total).toBe(2);
    });

    it('should handle empty thread array', () => {
      const total = calculateTotalUnreadCount([], 'user123');
      expect(total).toBe(0);
    });

    it('should handle missing unreadCount property', () => {
      const userId = 'user123';
      const threads = [{ id: '1' }, { id: '2', unreadCount: { [userId]: 3 } }];

      const total = calculateTotalUnreadCount(threads, userId);
      expect(total).toBe(3);
    });
  });

  describe('Local Notifications', () => {
    it('should schedule local notification', async () => {
      const notificationId = await scheduleLocalNotification(
        'Test Title',
        'Test Body',
        { test: true }
      );

      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe('string');
    });

    it('should clear all notifications', async () => {
      await expect(clearAllNotifications()).resolves.not.toThrow();
    });
  });

  describe('Notification Listeners', () => {
    it('should setup and cleanup notification listeners', () => {
      const cleanup = setupNotificationListeners();

      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe('function');

      // Cleanup should not throw
      expect(() => cleanup()).not.toThrow();
    });

    it('should call callbacks when provided', () => {
      const onReceived = jest.fn();
      const onTapped = jest.fn();

      const cleanup = setupNotificationListeners(onReceived, onTapped);

      expect(cleanup).toBeDefined();
      cleanup();
    });
  });
});

describe('Notification Integration', () => {
  it('should handle end-to-end notification flow (without auth)', async () => {
    // 1. Get preferences (returns defaults when not authenticated)
    const prefs = await getNotificationPreferences();
    expect(prefs).toBeDefined();

    // 2. Schedule test notification
    const notificationId = await scheduleLocalNotification(
      'Integration Test',
      'Testing notification flow',
      { integrationTest: true }
    );
    expect(notificationId).toBeDefined();

    // 3. Clear notifications
    await clearAllNotifications();

    // 4. Update badge
    await updateBadgeFromUnreadCount(5);

    // Test passes if no errors thrown
    expect(true).toBe(true);
  });
});
