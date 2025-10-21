// helloWorld.ts - Simple Hello World Cloud Function for testing
import { onCall } from 'firebase-functions/v2/https';

export const helloWorld = onCall(async (request) => {
  return {
    message: 'Hello from Communexus Firebase Cloud Functions!',
    timestamp: new Date().toISOString(),
    success: true
  };
});

