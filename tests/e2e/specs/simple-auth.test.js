// Simple Fast Auth Test
// Minimal test to verify basic functionality quickly

import { TestHelpers } from '../helpers/TestHelpers.js';

describe('Simple Auth Test (Fast)', () => {
  before(async () => {
    console.log('🚀 Starting simple fast test');
    await TestHelpers.waitForFirebaseEmulator();
    await TestHelpers.createFirebaseTestUsers();

    // CRITICAL: Wait for app to fully initialize (3-5 seconds)
    console.log('⏳ Waiting for app to load...');
    await browser.pause(4000);
  });

  it('should display auth screen', async () => {
    console.log('📱 Checking if auth screen is visible...');

    // Wait for email input to exist (should be quick now)
    await TestHelpers.waitForElement('~email-input', 3000);

    const emailInput = await $('~email-input');
    const exists = await emailInput.isExisting();

    console.log(`Email input exists: ${exists}`);
    expect(exists).toBe(true);
  });

  it('should be able to type in email field', async () => {
    console.log('⌨️  Testing email input...');

    const emailInput = await $('~email-input');
    await emailInput.setValue('john@test.com');

    const value = await emailInput.getValue();
    console.log(`Email value: ${value}`);
    expect(value).toBe('john@test.com');
  });

  it('should find sign in button', async () => {
    console.log('🔍 Finding sign in button...');

    const signInButton = await $('~sign-in-button');
    const exists = await signInButton.isExisting();

    console.log(`Sign in button exists: ${exists}`);
    expect(exists).toBe(true);
  });
});
