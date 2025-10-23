# Physical iPhone Testing Setup Guide

This guide will help you install and test Communexus on your physical iPhone.

## ✅ Configuration Complete

Your environment is already configured:
- ✅ `.env` file created with your Mac's IP: **10.110.1.169**
- ✅ `app.json` updated with owner: **xvanov**
- ✅ `eas.json` configured for development builds
- ✅ EAS CLI installed

## Step 1: Initialize EAS Project (One-time)

Run this command and follow the prompts:

```bash
npx eas init
```

**When prompted:**
- "Would you like to create a project for @xvanov/communexus?" → **Yes**
- It will create an EAS project and link it to your Expo account

## Step 2: Build Development Version for iPhone

```bash
# This will take ~10-15 minutes
npx eas build --profile development --platform ios
```

**What happens:**
1. EAS uploads your code to their servers
2. Builds the iOS app with development capabilities
3. Generates an installable IPA file
4. Sends you an email when complete

## Step 3: Install on Your iPhone

### Option A: Via QR Code (Easiest)

1. When build completes, you'll see a QR code in terminal
2. Open **Camera app** on your iPhone
3. Point at the QR code
4. Tap the notification
5. Follow install instructions:
   - **Settings** → **General** → **VPN & Device Management**
   - Tap the developer certificate
   - Tap **Trust**
6. Install the app

### Option B: Via Email Link

1. Check your email for "Build finished" from Expo
2. Open the link on your iPhone
3. Follow the same trust certificate steps above
4. Install the app

### Option C: Via EAS Dashboard

1. Go to: https://expo.dev/accounts/xvanov/projects/communexus/builds
2. Find your latest **development** build
3. Click **Install**
4. Scan QR code with iPhone Camera
5. Follow install instructions

## Step 4: Connect to Development Server

### Prerequisites

1. **Your iPhone and Mac MUST be on the same WiFi network**
2. **Firebase emulators must be running on your Mac**

### Start Development Environment

```bash
# Terminal 1: Firebase Emulators
npx firebase emulators:start

# Terminal 2: Metro Bundler
npm start
```

### Connect Your iPhone

1. **Open the Communexus app** on your iPhone
2. You'll see the Expo dev menu
3. **Two ways to connect:**

   **Method A: Automatic (if on same WiFi)**
   - The app should automatically connect to Metro
   - You'll see the app load

   **Method B: Manual (if automatic fails)**
   - Shake your iPhone
   - Tap "Enter URL manually"
   - Enter: `http://10.110.1.169:8081`
   - Tap "Connect"

## Step 5: Test the App!

### Login

Use test accounts:
- `a@test.com` / `password123`
- `b@test.com` / `password123`
- Or tap "Demo User" button

### Features to Test

✅ **Authentication** - Login/Logout  
✅ **Messaging** - Send/receive messages  
✅ **Real-time Sync** - Open app on simulator too, test multi-user chat  
✅ **Notifications** - Tap ⚙️ (Settings) button in header  
✅ **Settings Screen** - Configure notification preferences  
✅ **Badge Counts** - Watch unread badges update  
✅ **Media Sharing** - Use real camera to share photos  
✅ **Offline Mode** - Turn off WiFi, send messages, turn on WiFi  

## Multi-Device Testing (iPhone + Simulator)

Test real-time messaging between your physical iPhone and a simulator:

```bash
# Terminal 1: Firebase Emulators (already running)
npx firebase emulators:start

# Terminal 2: Metro (already running)
npm start

# Terminal 3: Start iOS Simulator
npx expo run:ios --device "iPhone 15"
```

**Now test messaging:**
1. **iPhone (Physical)**: Login as `a@test.com`
2. **Simulator**: Login as `b@test.com`
3. **Create conversation**: Tap + → Select other user
4. **Chat**: Messages sync instantly!

## Hot Reload

Once connected, **hot reload works automatically**:

1. Make code changes in your editor
2. Save the file
3. iPhone reloads automatically!
4. If it doesn't reload:
   - Shake iPhone → "Reload"
   - Or press 'r' in Metro terminal

## Troubleshooting

### App Won't Connect to Metro

**Check WiFi:**
```bash
# Verify your Mac's IP hasn't changed
ipconfig getifaddr en0

# Should be: 10.110.1.169
# If different, update .env file
```

**Manual Connection:**
1. Shake iPhone
2. "Enter URL manually"
3. Enter: `http://10.110.1.169:8081`

### Firebase Connection Errors

The `.env` file already has your Mac's IP configured for emulators.

If you still get errors:
1. Make sure Firebase emulators are running: `npx firebase emulators:start`
2. Check emulator UI: http://127.0.0.1:4000
3. Verify iPhone is on same WiFi as Mac

### "Unable to Install" Error

1. Delete old app from iPhone
2. **Settings** → **General** → **VPN & Device Management**
3. Delete old certificates
4. Reinstall app from QR code

### Build Fails

```bash
# Clean and retry
rm -rf node_modules ios/build
npm install
npx eas build --profile development --platform ios --clear-cache
```

## Quick Reference

### Daily Development Workflow

```bash
# 1. Start Firebase Emulators (Terminal 1)
npx firebase emulators:start

# 2. Start Metro (Terminal 2)
npm start

# 3. Open app on iPhone
# (It connects automatically!)

# 4. Make code changes
# (App reloads automatically!)
```

### Rebuild When Needed

Only rebuild when you:
- Add native dependencies
- Change `app.json` or `eas.json`
- Update Expo SDK version
- Change iOS permissions

Otherwise, hot reload handles everything!

### Useful Commands

```bash
# Check EAS login
npx eas whoami

# View your builds
npx eas build:list

# View project info
npx eas project:info

# Get Mac's IP
ipconfig getifaddr en0
```

## Next Steps

After successful installation:

1. ✅ Test all features on physical device
2. ✅ Test with simulator for multi-user messaging
3. ✅ Test push notifications (new feature!)
4. ✅ Test with real camera for media sharing
5. ✅ Test offline mode
6. ✅ Share with team (build with --profile preview)

---

**Happy Testing! 📱🚀**

Your iPhone is now a powerful development device with hot reload!

