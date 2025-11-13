# Testing Story 0-3: Image Analysis & Query System

## Quick Start (3 Steps)

### Terminal 1: Start Firebase Emulators
```bash
cd /Users/kalin.ivanov/rep/communexus/main
npx firebase emulators:start
```
**Keep this terminal running!** The emulators provide the backend (Firestore, Auth, Functions).

### Terminal 2: Start Expo & Open Simulator
```bash
cd /Users/kalin.ivanov/rep/communexus/main

# Option A: Use Expo CLI (interactive)
npm start
# Then press 'i' for iOS or 'a' for Android

# Option B: Direct iOS simulator
npx expo run:ios --device "iPhone 15"

# Option C: Direct Android emulator
npx expo run:android
```

### Terminal 3 (Optional): View Logs
```bash
# Watch for errors or console logs
npx expo start --dev-client
```

---

## Testing Checklist Features

### Step 1: Login
- Use demo user: `alice@demo.com` / `password123`
- OR tap "Try Demo User" button

### Step 2: Navigate to Checklists
1. Open or create a **Thread** (project conversation)
2. Look for **"Checklists"** button in thread header
3. Tap **"Checklists"** button
4. Create a new checklist OR open existing one
5. You should see **ChecklistDetailView** with:
   - Checklist items (checkboxes)
   - **📷 Analyze Image for Checklist** button (bottom)
   - **Query Input** component (text field + 🎤 voice button)
   - Query results display area

---

## Testing Image Analysis (AC 1-5)

### Test Flow:
1. **Tap** "📷 Analyze Image for Checklist" button
2. **Enter image URL** when prompted:
   ```
   https://images.unsplash.com/photo-1586023492125-27b2c045efd7
   ```
   (This is a kitchen/construction image - good for testing)
3. **Wait** for analysis (uses GPT-4 Vision API - may take 5-10 seconds)
4. **Review ImageAnalysisModal** showing:
   - ✅ Summary of what's in the image
   - ✅ Completion status (complete/incomplete/partial)
   - ✅ Detected tasks with confidence scores
   - ✅ Matched checklist items
   - ✅ Suggested updates ("Mark 'Install cabinets' as complete?")

### Test Approve/Reject:
- **Tap "Approve"** → Item should be marked complete, photo linked
- **Tap "Reject"** → Suggestion dismissed, no changes
- **Verify**: Completed items should show in checklist with photo thumbnail

### Expected Behavior:
- ✅ Modal displays analysis results
- ✅ Confidence scores shown (high/medium/low)
- ✅ Approve button marks item complete
- ✅ Photo URL added to item's mediaAttachments
- ✅ Checklist refreshes showing completed item

---

## Testing Query System (AC 6-9)

### Test Queries:

#### 1. "what's next?"
- **Type** or **speak** (tap 🎤): "what's next?"
- **Expected**: Shows next uncompleted task
- **Example Result**: "Next task: Install countertops" with link

#### 2. "show incomplete"
- **Type** or **speak**: "show incomplete"
- **Expected**: Lists all incomplete items
- **Example Result**: "Found 3 incomplete tasks: Install tiles, Paint walls, Install countertops"

#### 3. "how many done?"
- **Type** or **speak**: "how many done?"
- **Expected**: Shows progress count
- **Example Result**: "2 of 5 tasks complete (40%)"

### Test Voice Input:
1. **Tap 🎤 button** (microphone icon)
2. **Speak** your query (e.g., "what's next?")
3. **Wait** for transcription
4. **Tap "Send"** or let it auto-process

### Expected Behavior:
- ✅ Query input accepts text and voice
- ✅ Results display in readable format
- ✅ Navigation links work (tap to navigate - currently shows alert)
- ✅ Progress shown correctly
- ✅ Next task identified correctly

---

## Troubleshooting

### Simulator Not Opening?
```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator manually
xcrun simctl boot "iPhone 15"

# Then run Expo
npx expo run:ios --device "iPhone 15"
```

### Firebase Emulators Not Running?
- Check Terminal 1 - emulators must be running
- Verify emulator UI: http://127.0.0.1:4000
- Check Firestore: http://127.0.0.1:8080

### App Not Connecting to Emulators?
- Verify Firebase config points to emulators
- Check `firebase.json` emulator settings
- Restart both emulators and Expo

### Image Analysis Not Working?
- Verify GPT-4 Vision API is configured in Cloud Functions
- Check Cloud Functions logs in Firebase emulator UI
- Ensure image URL is publicly accessible (https://)

### Query Not Working?
- Check checklist has items
- Verify query text matches expected patterns
- Check console logs for errors

---

## Test Checklist

### Image Analysis Features:
- [ ] Button visible in ChecklistDetailView
- [ ] Modal opens when button tapped
- [ ] Image URL prompt appears
- [ ] Analysis completes (5-10 seconds)
- [ ] Detected tasks shown with confidence
- [ ] Matched items displayed
- [ ] Approve button works
- [ ] Reject button works
- [ ] Item marked complete after approval
- [ ] Photo linked to item

### Query Features:
- [ ] Query input visible (text + voice)
- [ ] "what's next?" returns next task
- [ ] "show incomplete" lists incomplete items
- [ ] "how many done?" shows progress
- [ ] Results display correctly
- [ ] Navigation links work
- [ ] Voice input works (if voice library installed)

---

## Sample Test Data

### Create a Test Checklist:
1. Navigate to Checklists
2. Tap "+ New Checklist"
3. Title: "Kitchen Renovation"
4. Add items:
   - "Install cabinets" (pending)
   - "Install countertops" (pending)
   - "Paint walls" (pending)
   - "Install tiles" (completed)
   - "Install fixtures" (pending)

### Test Image URLs:
- Kitchen: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7`
- Construction: `https://images.unsplash.com/photo-1504307651254-35680f356dfd`
- Bathroom: `https://images.unsplash.com/photo-1552321554-5fefe8c9ef14`

---

## Next Steps After Testing

If everything works:
- ✅ Story 0-3 is complete and ready for production
- ✅ All acceptance criteria verified
- ✅ All features functional

If issues found:
- Check console logs for errors
- Verify Firebase emulators are running
- Check Cloud Functions are deployed/emulated
- Review error messages in UI

