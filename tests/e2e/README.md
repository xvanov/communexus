# Automated UI Testing with Appium

This directory contains automated UI tests for the Communexus mobile app using Appium and WebDriverIO.

## Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

### Overview

The automated testing infrastructure provides:
- **Cross-platform testing** for iOS and Android
- **Page Object Model** for maintainable test code
- **CI/CD integration** with GitHub Actions
- **Screenshot capture** for visual regression testing
- **Test data management** and cleanup utilities

### Prerequisites

- Node.js 18+
- Appium 3.0+
- iOS Simulator (for iOS tests)
- Android Emulator (for Android tests)
- Firebase Emulators running locally

### Installation

```bash
# Install dependencies
npm install

# Install Appium globally
npm install -g appium@latest

# Install Appium drivers
appium driver install xcuitest  # For iOS
appium driver install uiautomator2  # For Android

# Verify installation
npm run appium:doctor
```

### Running Tests

#### Local Development

```bash
# Start Firebase emulators
firebase emulators:start --only firestore,auth,storage --project demo-communexus

# Start Appium server (in separate terminal)
npm run appium:server

# Run all E2E tests
npm run test:e2e

# Run iOS tests only
npm run test:e2e:ios

# Run Android tests only
npm run test:e2e:android

# Run tests in headless mode
npm run test:e2e:headless
```

#### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Daily at 2 AM UTC (scheduled)

### Test Structure

```
tests/e2e/
├── specs/           # Test specifications
│   ├── auth.test.js      # Authentication flow tests
│   └── messaging.test.js # Messaging flow tests
├── pages/           # Page Object Models
│   ├── AuthScreen.js     # Authentication screen
│   ├── ChatListScreen.js # Chat list screen
│   └── ChatScreen.js     # Chat screen
└── helpers/         # Test utilities
    └── TestHelpers.js    # Helper functions
```

### Page Object Model

Each screen has a corresponding Page Object that encapsulates:
- **Element selectors** using accessibility IDs
- **Actions** (tap, type, swipe, etc.)
- **Verification methods** (isDisplayed, getText, etc.)
- **Wait methods** (waitForElement, waitForText, etc.)

Example:
```javascript
// Using Page Object
const authScreen = new AuthScreen();
await authScreen.signInWithCredentials('user@test.com', 'password');
await authScreen.waitForLoadingToComplete();
```

### Test Data Management

Test data is managed through environment variables:
- `TEST_USER_EMAIL`: Primary test user email
- `TEST_USER_PASSWORD`: Primary test user password
- `TEST_USER_EMAIL_2`: Secondary test user email
- `TEST_USER_PASSWORD_2`: Secondary test user password

### Screenshots and Reporting

- **Screenshots** are automatically captured on test failures
- **Test results** are saved in JUnit XML format
- **Cross-platform reports** compare iOS and Android test results
- **Artifacts** are uploaded to GitHub Actions for review

### Accessibility IDs

All interactive elements must have accessibility IDs for reliable testing:

```javascript
// React Native component
<TouchableOpacity testID="sign-in-button" accessibilityLabel="Sign In">
  <Text>Sign In</Text>
</TouchableOpacity>

// Test selector
private signInButton = '~sign-in-button';
```

### Best Practices

1. **Use Page Object Model** for maintainable tests
2. **Add accessibility IDs** to all interactive elements
3. **Use explicit waits** instead of sleep statements
4. **Take screenshots** on test failures for debugging
5. **Clean up test data** after each test run
6. **Test cross-platform consistency** regularly

### Troubleshooting

#### Common Issues

1. **Appium server not running**
   ```bash
   npm run appium:server
   ```

2. **Simulator/Emulator not found**
   ```bash
   # iOS
   xcrun simctl list devices
   
   # Android
   adb devices
   ```

3. **Firebase emulators not running**
   ```bash
   firebase emulators:start --only firestore,auth,storage
   ```

4. **Element not found**
   - Verify accessibility ID is set correctly
   - Check if element is visible and enabled
   - Use explicit waits instead of immediate assertions

#### Debug Mode

Run tests with debug logging:
```bash
LOG_LEVEL=debug npm run test:e2e
```

### Contributing

When adding new tests:
1. Create Page Objects for new screens
2. Add accessibility IDs to new elements
3. Write tests following the existing patterns
4. Update this documentation if needed

### Future Enhancements

- [ ] Visual regression testing with Percy
- [ ] Performance testing integration
- [ ] Test data factories for complex scenarios
- [ ] Parallel test execution
- [ ] Cloud testing integration (BrowserStack, Sauce Labs)


