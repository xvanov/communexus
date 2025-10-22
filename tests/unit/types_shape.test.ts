// tests/unit/types_shape.test.ts
// T013 - Validate shapes of core TypeScript interfaces

import { User } from '../../src/types/User';
import { Thread } from '../../src/types/Thread';
import { Message } from '../../src/types/Message';
import { AISummary, Decision, ActionItem } from '../../src/types/AIFeatures';
// Intentionally reference types that are not yet implemented to drive TDD
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Media } from '../../src/types/Media';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Notification } from '../../src/types/Notification';

describe('Types shape (T013)', () => {
  test('User, Thread, Message, AI types basic fields exist', () => {
    const user: User = {
      id: 'u1',
      email: 'a@example.com',
      name: 'Alice',
      role: 'contractor',
      online: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const thread: Thread = {
      id: 't1',
      participants: ['u1', 'u2'],
      participantDetails: [{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }],
      isGroup: false,
      lastMessage: {
        text: 'hello',
        senderId: 'u1',
        senderName: 'Alice',
        timestamp: new Date(),
      },
      unreadCount: { u1: 0, u2: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const message: Message = {
      id: 'm1',
      threadId: 't1',
      senderId: 'u1',
      senderName: 'Alice',
      text: 'hello',
      status: 'sent',
      deliveredTo: [],
      readBy: [],
      readTimestamps: {},
      createdAt: new Date(),
    };

    const summary: AISummary = {
      id: 's1',
      threadId: 't1',
      summary: '...',
      keyDecisions: [],
      actionItems: [],
      unresolvedIssues: [],
      nextSteps: [],
      generatedAt: new Date(),
      messageCount: 0,
      lastMessageId: 'm1',
    };

    const decision: Decision = {
      id: 'd1',
      threadId: 't1',
      messageId: 'm1',
      decision: 'Use tile A',
      context: 'Kitchen remodel',
      participants: ['u1', 'u2'],
      decidedAt: new Date(),
      markedBy: 'u1',
      createdAt: new Date(),
    };

    const action: ActionItem = {
      id: 'a1',
      threadId: 't1',
      messageId: 'm2',
      task: 'Order materials',
      status: 'pending',
      createdAt: new Date(),
    };

    expect(user).toHaveProperty('email');
    expect(thread).toHaveProperty('participants');
    expect(message).toHaveProperty('text');
    expect(summary).toHaveProperty('summary');
    expect(decision).toHaveProperty('decision');
    expect(action).toHaveProperty('task');
  });

  test('Media and Notification types must be implemented', () => {
    // This test intentionally references types that are not yet implemented
    // to ensure T013 includes adding these models
    expect(true).toBe(true);
  });
});
