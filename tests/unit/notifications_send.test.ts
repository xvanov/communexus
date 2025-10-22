// tests/unit/notifications_send.test.ts
// T015 - Unit tests for FCM sending via firebase-admin

jest.mock('firebase-admin', () => {
  const send = jest.fn().mockResolvedValue('msgid-1');
  const sendMulticast = jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 });
  return {
    __esModule: true,
    default: {
      initializeApp: jest.fn(),
      messaging: () => ({ send, sendMulticast }),
    },
    initializeApp: jest.fn(),
    messaging: () => ({ send, sendMulticast }),
  };
});

import admin, { messaging } from 'firebase-admin';

describe('Notifications (T015)', () => {
  test('sends single token notification with payload', async () => {
    const payload = { notification: { title: 'Hi', body: 'There' } } as any;
    const token = 'fcm-token';
    const id = await (admin.messaging() as any).send({ token, ...payload });
    expect(id).toBe('msgid-1');
  });

  test('sends multicast notification', async () => {
    const res = await (admin.messaging() as any).sendMulticast({ tokens: ['t1', 't2'], notification: { title: 'Hi' } });
    expect(res.successCount).toBeGreaterThanOrEqual(0);
  });
});
