// Debug Test to see what screen the app is on
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

describe('Debug Test', () => {
  it('should take a screenshot and show current screen', async () => {
    // Take a screenshot to see what's currently on screen
    const screenshotPath = `/Users/kalin.ivanov/rep/communexus/main/test-results/screenshots/debug-current-screen-${Date.now()}.png`;
    await browser.saveScreenshot(screenshotPath);
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Try to find various elements to see what's available
    const elements = [
      '~email-input',
      '~password-input',
      '~sign-in-button',
      '~chat-list-title',
      '~logout-button',
      '~new-chat-button',
    ];

    for (const elementId of elements) {
      try {
        const element = await $(elementId);
        const isDisplayed = await element.isDisplayed();
        console.log(
          `Element ${elementId}: found=${!!element}, displayed=${isDisplayed}`
        );
      } catch (error) {
        console.log(`Element ${elementId}: not found`);
      }
    }

    // Get page source to see what's actually rendered
    const pageSource = await browser.getPageSource();
    console.log('Page source length:', pageSource.length);
    console.log('Page source preview:', pageSource.substring(0, 500));
  });
});
