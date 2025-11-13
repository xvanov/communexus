# Fix Image Analysis "not-found" Error

## Problem
Getting `not-found` error when trying to analyze images. This means the Cloud Function `aiChecklistVision` isn't available in the Functions emulator.

## Solution

### Step 1: Restart Firebase Emulators

The Functions emulator needs to be restarted to load the new functions (`aiChecklistVision` and `aiChecklistQuery`).

**In Terminal 1 (where emulators are running):**
1. Stop emulators: Press `Ctrl+C`
2. Restart emulators:
   ```bash
   npx firebase emulators:start
   ```

**Wait for:** "All emulators ready" message

### Step 2: Verify Functions are Loaded

1. Open Functions emulator UI: http://127.0.0.1:4000
2. Click on "Functions" tab
3. You should see `aiChecklistVision` and `aiChecklistQuery` in the list

### Step 3: Test Image Analysis

1. In the app, go to a checklist
2. Tap "📷 Analyze Image for Checklist"
3. Enter image URL: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7`
4. Should work now!

## If Still Not Working

### Check Functions Build

```bash
cd functions
npm run build
```

This should compile `aiChecklistVision.ts` and `aiChecklistQuery.ts` to JavaScript.

### Verify Functions are Exported

Check `functions/src/index.ts` - should export:
- `aiChecklistVision`
- `aiChecklistQuery`

### Check Emulator Logs

In the emulator terminal, you should see:
```
✔  functions[aiChecklistVision]: http function initialized
✔  functions[aiChecklistQuery]: http function initialized
```

## Common Issues

### "Invalid image URL format"
- Make sure URL starts with `https://` or `http://`
- Example: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7`
- Don't include quotes or extra spaces

### "not-found" error
- Functions emulator not running → Start it
- Functions not built → Run `cd functions && npm run build`
- Emulator needs restart → Restart emulators

### Push token errors
- These are expected on iOS Simulator
- Can be ignored - they don't affect functionality


