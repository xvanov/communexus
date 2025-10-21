// Test for Hello World Firebase Cloud Function
import { describe, it, expect } from '@jest/globals';

describe('Firebase Cloud Functions', () => {
  describe('Hello World Function', () => {
    it('should be callable and return hello message', async () => {
      // Test the deployed helloWorld function
      const response = await fetch(
        'https://us-central1-communexus.cloudfunctions.net/helloWorld',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: {} }),
        }
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.result.message).toBe(
        'Hello from Communexus Firebase Cloud Functions!'
      );
      expect(result.result.success).toBe(true);
      expect(result.result.timestamp).toBeDefined();
    });
  });
});
