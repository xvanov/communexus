// messageHelpers.ts - Message utility functions
// TODO: Implement message helper functions
import { Message } from '../types/Message';

export const isMessageFromCurrentUser = (
  message: Message,
  currentUserId: string
): boolean => {
  // TODO: Implement current user check
  return message.senderId === currentUserId;
};

export const getMessageStatus = (message: Message): string => {
  // TODO: Implement message status logic
  return message.status || 'sent';
};
