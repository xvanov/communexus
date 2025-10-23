# 🚀 EAS Development Build - Quick Start

## ⚡ After Xcode Upgrade Completes

Copy and paste these commands one at a time:

### **1. Verify Xcode (30 seconds)**
```bash
xcodebuild -version
# Must show: Xcode 16.1 or higher
# If not, run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### **2. Set UTF-8 Encoding (30 seconds)**
```bash
export LANG=en_US.UTF-8
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
```

### **3. Generate iOS Project (5-10 minutes)**
```bash
cd /Users/kalin.ivanov/rep/communexus/main
npx expo prebuild --platform ios --clean
```

**Wait for:** "✔ Finished prebuild"

### **4. Build & Install App (5-10 minutes)**
```bash
npx expo run:ios --device "iPhone 15"
```

**Wait for:** App launches in simulator

### **5. Test E2E (30 seconds)**
```bash
# Terminal 1: Start Appium
npm run appium:server

# Terminal 2: Run tests
npm run test:e2e:ios
```

**Expected:** Tests should PASS! ✅

---

## 🎯 Success Criteria

You'll know it worked when:
1. ✅ App runs in simulator with no Expo Go wrapper
2. ✅ `xcrun simctl listapps booted | grep communexus` shows your app
3. ✅ Appium can find elements (`isDisplayed()` returns true)
4. ✅ E2E tests pass

---

## 🆘 If Something Goes Wrong

**Prebuild fails:**
```bash
rm -rf ios/ android/
npx expo prebuild --platform ios --clean
```

**Build fails:**
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

**Tests still fail:**
```bash
# Check app is installed
xcrun simctl listapps booted | grep com.communexus

# Check Appium can connect
npm run test:e2e:ios -- --spec=./tests/e2e/specs/connection.test.js
```

---

## 📱 After First Build

**Development workflow becomes:**
```bash
# Edit your code
# Save file
# App auto-reloads (just like Expo Go!)

# Only rebuild when:
# - npm install new package
# - Change app.json
# - Change native code
```

**It's the best of both worlds!** ✨

---

See `docs/EAS-SETUP.md` for detailed documentation.

