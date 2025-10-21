// messageHelpers.ts - Message utility functions
// TODO: Implement message helper functions
export const isMessageFromCurrentUser = (message: any, currentUserId: string): boolean => {
  // TODO: Implement current user check
  return message.senderId === currentUserId;
};

export const getMessageStatus = (message: any): string => {
  // TODO: Implement message status logic
  return message.status || 'sent';
};

