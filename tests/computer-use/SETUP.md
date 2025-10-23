# Quick Setup Guide for Computer Use Testing

## 🚀 5-Minute Setup

### Step 1: Get Anthropic API Key (2 minutes)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

### Step 2: Set Environment Variable (30 seconds)

**Option A: Export in terminal (temporary)**
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Option B: Add to your shell profile (permanent)**
```bash
# For zsh (macOS default)
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Start the App (1 minute)

```bash
# Terminal 1: Start Expo
npm start

# Press 'i' to open in iOS Simulator
# Wait for app to load in Expo Go
```

### Step 4: Run the Test (30 seconds)

```bash
# Make sure you're in the project directory
cd /Users/kalin.ivanov/rep/communexus/main

# Run the auth flow test
npm run test:ai:auth
```

## 🎬 What Will Happen

1. Test finds your booted iOS Simulator
2. Takes a screenshot
3. Sends it to Claude
4. Claude analyzes and tells us what's on screen
5. Test executes actions (tap, type, etc.)
6. Claude verifies the results
7. **Total time: ~3-5 minutes per test run**

## 📊 Expected Output

```
🚀 Starting Computer Use Auth Tests

✅ Test runner initialized

📱 Using simulator: ABC123-DEF4-5678-9012-345678901234
📦 App bundle: host.exp.Exponent

📋 Test 1: Verify auth screen is displayed
📸 Screenshot saved: step-1-123456789.png
💭 Asking Claude: "Is this the authentication screen with email..."
✅ PASS: Verify auth screen is displayed

📋 Test 2: Check for demo user button
📸 Screenshot saved: step-2-123456790.png
💭 Asking Claude: "Is there a Try Demo User button..."
✅ PASS: Check for demo user button

...

=================================================
📊 TEST RESULTS SUMMARY
=================================================
Total Tests:  7
✅ Passed:    7
❌ Failed:    0
📈 Pass Rate: 100.00%
=================================================
```

## 💰 Cost Tracking

Each test run costs approximately **$0.05-0.10**.

**Monthly estimates:**
- Development (20 runs/day): ~$40/month
- CI/CD only (5 runs/week): ~$2/month
- Mixed usage: ~$25-30/month

## 🆘 Troubleshooting

### Test hangs or fails

1. **Check simulator**:
   ```bash
   xcrun simctl list devices booted
   ```
   Make sure you have exactly ONE booted device.

2. **Check app is running**:
   - Open Simulator
   - Verify Communexus is displayed (not Expo Go home)

3. **Check API key**:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```
   Should print your key.

4. **Check screenshot directory**:
   ```bash
   ls -la test-results/computer-use/
   ```
   Screenshots should be appearing here.

### Improve accuracy

1. **Add more context** to questions:
   ```javascript
   // Bad
   await runner.assert('Is this correct?', 'yes');
   
   // Good
   await runner.assert(
       'Is this the login screen with a large "Communexus" title at the top, ' +
       'email and password input fields in the middle, and a blue Sign In button below?',
       'yes'
   );
   ```

2. **Increase wait times** if UI is slow:
   ```javascript
   // In config.js
   timing: {
       afterClick: 1000,  // Increased from 500
       afterType: 500,    // Increased from 300
   }
   ```

## ✅ You're All Set!

Run your first AI-powered test:
```bash
npm run test:ai:auth
```

Watch as Claude interacts with your app automatically! 🎉


