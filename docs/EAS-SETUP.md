# EAS Development Build Setup Guide

This guide will help you set up a development build that works perfectly with Appium E2E tests.

## ✅ Prerequisites (Complete These First)

- [x] macOS 14.5+ (updated from 14.2.1)
- [x] Xcode 16.1+ (upgrading now...)
- [x] expo-dev-client installed
- [x] app.json has bundleIdentifier
- [x] eas.json configured

## 🚀 Step-by-Step Setup

### **Step 1: Verify Xcode Installation** (After upgrade completes)

```bash
# Check Xcode version
xcodebuild -version
# Should show: Xcode 16.1 or higher

# Select the correct Xcode
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Accept license
sudo xcodebuild -license accept

# Verify command line tools
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer
```

### **Step 2: Set UTF-8 Encoding**

```bash
# Add to shell profile (if not already done)
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $LANG
# Should output: en_US.UTF-8
```

### **Step 3: Generate Native iOS Project**

```bash
cd /Users/kalin.ivanov/rep/communexus/main

# Generate iOS project with CocoaPods
npx expo prebuild --platform ios

# This will:
# - Create ios/ directory
# - Generate Xcode project files
# - Install CocoaPods dependencies
# - Take ~5-10 minutes
```

**Expected Output:**
```
✔ Created native directory
✔ Updated package.json
✔ Finished prebuild
✔ Installed CocoaPods dependencies
```

### **Step 4: Build the App for Simulator**

```bash
# Build and install in simulator
npx expo run:ios --device "iPhone 15"

# This will:
# - Compile the app with Xcode
# - Install in the running simulator
# - Launch the app automatically
# - First build: 5-10 minutes
# - Subsequent builds: 2-3 minutes (incremental)
```

**Alternative: Build with Xcode GUI**
```bash
# Open project in Xcode
open ios/Communexus.xcworkspace

# In Xcode:
# 1. Select "Communexus" scheme (top bar)
# 2. Select "iPhone 15" as target device
# 3. Click Run button (▶️) or press Cmd+R
```

### **Step 5: Verify App is Installed**

```bash
# Check if app is installed with correct bundleId
xcrun simctl listapps booted | grep communexus

# Should show something like:
# com.communexus.communexus = {
#     ...
# }
```

### **Step 6: Test Appium Connection**

```bash
# Terminal 1: Start Appium
npm run appium:server

# Terminal 2: Run E2E tests
npm run test:e2e:ios
```

**Expected:** All tests should now PASS! ✅

---

## 🔧 Configuration Files (Already Updated)

### ✅ `.gitignore`
```
ios/build/      # Ignore build outputs
ios/Pods/       # Ignore CocoaPods
# But KEEP ios/ directory itself
```

### ✅ `wdio.ios.conf.js`
```javascript
capabilities: [{
    'appium:bundleId': 'com.communexus.communexus',
    'appium:noReset': false,        // Clear state between tests
    'appium:autoAcceptAlerts': true // Dismiss system alerts
}]
```

### ✅ `app.json`
```json
{
  "ios": {
    "bundleIdentifier": "com.communexus.communexus"
  }
}
```

---

## 🐛 Troubleshooting

### **Issue: CocoaPods fails with encoding error**

```bash
# Make sure LANG is set
export LANG=en_US.UTF-8
cd ios
pod install
```

### **Issue: Build fails in Xcode**

```bash
# Clean build folder
cd ios
xcodebuild clean -workspace Communexus.xcworkspace -scheme Communexus

# Try again
npx expo run:ios
```

### **Issue: "No simulators found"**

```bash
# List available simulators
xcrun simctl list devices

# Boot iPhone 15
xcrun simctl boot "iPhone 15"

# Then try build again
```

### **Issue: App crashes on launch**

```bash
# Check logs
xcrun simctl spawn booted log stream --predicate 'process == "Communexus"'

# Or check in Xcode: Window → Devices and Simulators → View Device Logs
```

---

## 📁 Development Workflow (After Setup)

### **Daily Development:**
```bash
# Start development server
npm start

# The dev build will auto-reload JS changes!
# No rebuild needed for 95% of changes
```

### **When to Rebuild:**
Only rebuild when you change:
- Native dependencies (npm install new package)
- app.json configuration
- Native code (if you add any)

```bash
# Rebuild
npx expo run:ios
# Time: 2-3 minutes (incremental)
```

### **Running E2E Tests:**
```bash
# Make sure app is running in simulator
# Then:
npm run appium:server &
npm run test:e2e:ios

# All tests should PASS now! ✅
```

---

## ⏱️ Timeline

| Step | Time | What Happens |
|------|------|--------------|
| Xcode upgrade | 30-60 min | ⏳ Happening now... |
| expo prebuild | 5-10 min | Generates iOS project |
| First build | 5-10 min | Compiles app |
| Install & verify | 1 min | Ready to test! |
| Run E2E tests | 1 min | **PASSING TESTS!** ✅ |

**Total: 40-80 minutes** (mostly waiting for Xcode)

---

## 🎉 What You'll Get

After this setup:
- ✅ Fast development (JS hot reload still works!)
- ✅ Proper E2E tests that PASS
- ✅ `noReset: false` clears state between tests
- ✅ No more Expo Go visibility issues
- ✅ Production-like environment
- ✅ Ready for App Store submission later

---

## 🚀 Quick Start (Run After Xcode Upgrade Completes)

```bash
# 1. Verify Xcode
xcodebuild -version  # Should be 16.1+

# 2. Set encoding
export LANG=en_US.UTF-8

# 3. Generate iOS project
npx expo prebuild --platform ios

# 4. Build and run
npx expo run:ios --device "iPhone 15"

# 5. Test it!
npm run appium:server &
npm run test:e2e:ios

# 6. Celebrate! 🎉
```

---

## 📝 Next Steps

**While Xcode upgrades:**
- ☕ Grab coffee
- 📖 Read the docs above
- ✅ Make sure simulator is running

**When Xcode finishes:**
1. Run `xcodebuild -version` to verify
2. Follow the "Quick Start" commands above
3. Let me know if you hit any issues!

I'll be here to help troubleshoot each step. **Good luck!** 🚀

