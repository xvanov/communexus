// validation.ts - Input validation utilities
// TODO: Implement validation functions
export const validateEmail = (email: string): boolean => {
  // TODO: Implement email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateMessage = (text: string): boolean => {
  // TODO: Implement message validation
  return text.trim().length > 0;
};

