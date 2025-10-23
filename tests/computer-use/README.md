# Computer Use Testing with Claude 3.5 Sonnet

This directory contains E2E tests that use **Claude 3.5 Sonnet's Computer Use** capabilities to interact with the Communexus app like a human would.

## 🎯 Why Computer Use Testing?

**Advantages:**
- ✅ Works with Expo Go (no rebuild needed)
- ✅ Doesn't require accessibility IDs or test selectors
- ✅ Self-healing tests (adapts to UI changes)
- ✅ Natural language test descriptions
- ✅ Can detect visual bugs
- ✅ No Xcode version requirements

**Cost:** ~$40-50/month for active development

## 📋 Prerequisites

1. **Anthropic API Key**
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```
   Get your API key from: https://console.anthropic.com/

2. **iOS Simulator Running**
   - Open Xcode Simulator
   - Boot your preferred device (e.g., iPhone 15)
   - Launch the Communexus app in Expo Go

3. **App Running**
   ```bash
   npm start
   # Then press 'i' to open in iOS Simulator
   ```

## 🚀 Running Tests

### Run all AI tests
```bash
npm run test:ai
```

### Run specific test
```bash
npm run test:ai:auth
```

### Debug mode (with verbose logging)
```bash
ANTHROPIC_API_KEY=sk-ant-... node tests/computer-use/auth-flow.test.js
```

## 📁 Test Structure

```
tests/computer-use/
├── ComputerUseTestRunner.js  # Core test framework
├── config.js                  # Test configuration
├── auth-flow.test.js          # Authentication tests
└── README.md                  # This file
```

## 🔧 How It Works

### 1. Test Runner (`ComputerUseTestRunner.js`)
- Takes screenshots of the simulator
- Sends them to Claude with natural language instructions
- Claude analyzes the screen and tells us what to do
- Executes actions using `xcrun simctl` commands

### 2. Example Test Flow
```javascript
const runner = new ComputerUseTestRunner();
await runner.initialize();

// Ask Claude to analyze the screen
await runner.assert(
    'Is this the login screen with email and password fields?',
    'yes'
);

// Ask Claude to find an element
const location = await runner.analyzeScreen(
    'What are the coordinates of the email input?'
);

// Tap at those coordinates
await runner.tapAt(x, y);

// Type text
await runner.typeText('john@test.com');

// Verify result
await runner.assert(
    'Is the email field now filled?',
    'yes'
);
```

## ⚙️ Configuration

Edit `config.js` to customize:
- Claude model and settings
- Simulator device ID
- App bundle ID
- Screenshot directory
- Timing delays
- Test user credentials

## 📊 Cost Estimation

**Claude 3.5 Sonnet Pricing:**
- Input: $3 per million tokens
- Output: $15 per million tokens
- Images: ~1,500 tokens each

**Typical Test:**
- 7 assertions + 5 screenshots = ~$0.05 per test run
- 20 runs/day during development = ~$1/day
- **Monthly cost: ~$40-50**

## 🐛 Debugging

### If tests fail:

1. **Check screenshots**
   ```bash
   open test-results/computer-use/
   ```

2. **Verify simulator is running**
   ```bash
   xcrun simctl list devices booted
   ```

3. **Check app is loaded**
   - Make sure Expo Go is showing your app
   - Not the Expo Go home screen

4. **Increase wait times**
   - Edit `config.js` timing settings
   - Slower phones may need longer delays

### Common Issues:

**"No booted simulator found"**
- Start iOS Simulator
- Boot a device
- Launch the app in Expo Go

**"ANTHROPIC_API_KEY is required"**
- Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
- Or export in terminal

**"Failed to tap"**
- Coordinates might be wrong
- Ask Claude to re-analyze the screen
- Check screenshot to verify element location

## 🎨 Writing New Tests

1. Create new test file in `tests/computer-use/`
2. Import the runner
3. Write natural language assertions
4. Run and iterate

Example:
```javascript
const ComputerUseTestRunner = require('./ComputerUseTestRunner');

async function runMyTest() {
    const runner = new ComputerUseTestRunner();
    await runner.initialize();

    // Your test steps here
    await runner.assert('Is the home screen visible?', 'yes');
    
    runner.printResults();
}

runMyTest();
```

## 🔄 Comparison with Appium

| Feature | Appium (Traditional) | Computer Use (AI) |
|---------|---------------------|-------------------|
| **Setup Time** | 2 hours | 10 minutes |
| **Works with Expo Go** | Limited | ✅ Yes |
| **Speed** | Fast (30 sec) | Slow (3-5 min) |
| **Cost** | Free | $40-50/month |
| **Reliability** | 95%+ | 75-85% |
| **Maintenance** | High | Low |
| **Adapts to UI changes** | No | ✅ Yes |

## 📚 Resources

- [Anthropic Computer Use Documentation](https://docs.anthropic.com/claude/docs/computer-use)
- [Claude API Pricing](https://www.anthropic.com/pricing)
- [iOS Simulator CLI Reference](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/InteractingwiththeiOSSimulator/InteractingwiththeiOSSimulator.html)

## 🚀 Next Steps

1. Set your ANTHROPIC_API_KEY
2. Start the iOS Simulator with Expo Go
3. Run `npm run test:ai:auth`
4. Watch the magic happen! 🎩✨


