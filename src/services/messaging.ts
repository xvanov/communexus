// messaging.ts - Send/receive messages with Firestore real-time listeners
// TODO: Implement real-time messaging with optimistic UI updates
import { Message } from '../types/Message';

export const sendMessage = async (_message: Message) => {
  // TODO: Implement message sending
};

export const subscribeToMessages = (
  _threadId: string,
  _callback: (messages: Message[]) => void
) => {
  // TODO: Implement real-time message subscription
};
