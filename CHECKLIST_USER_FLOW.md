# Complete Checklist User Flow Guide

## 🎯 Quick Overview

**Navigation Path:**
```
Login → Chat List → Open Thread → Tap ✓ Button → Checklists → Create/Open Checklist → Use Features
```

---

## 📱 Step-by-Step User Flow

### **Step 1: Login to the App**

1. **Open the app** in simulator
2. **Login options:**
   - Use demo user: `alice@demo.com` / `password123`
   - OR tap **"Try Demo User"** button (if available)
3. You'll see the **Chat List** screen (list of all conversations/threads)

---

### **Step 2: Open or Create a Thread**

**Option A: Open Existing Thread**
- Tap any thread/conversation from the list
- This opens the **Chat Screen** (messaging interface)

**Option B: Create New Thread**
- Tap **"+"** or **"New Thread"** button
- Select a contact or create a group
- This opens the **Chat Screen**

---

### **Step 3: Access Checklists**

Once you're in the **Chat Screen** (thread view):

1. **Look at the top-right corner** of the header
2. You'll see **three buttons**:
   - **✓** (Checklists button) ← **TAP THIS ONE!**
   - **📋** (Action Items)
   - **✨** (AI Summary)

3. **Tap the ✓ button** (checkmark icon)
4. This navigates to the **Checklists Screen**

---

### **Step 4: Create a Checklist**

On the **Checklists Screen**:

1. **Tap "+ New Checklist"** button (top of screen)
2. **Fill in the form:**
   - **Title**: e.g., "Kitchen Renovation"
   - **Add Items**: 
     - Type item name (e.g., "Install cabinets")
     - Tap **"Add Item"** button
     - Repeat for more items:
       - "Install countertops"
       - "Paint walls"
       - "Install tiles"
       - "Install fixtures"
3. **Tap "Save"** button
4. Checklist is created and appears in the list

---

### **Step 5: Open Checklist Detail View**

1. **Tap on any checklist** from the list
2. This opens **ChecklistDetailView** - this is where ALL the features are!

**You'll see:**
- ✅ Checklist items with checkboxes
- ✅ Progress indicator (X/Y items complete)
- ✅ **📷 Analyze Image for Checklist** button (bottom)
- ✅ **Query Input** component (text field + 🎤 voice button)
- ✅ **NLP Input** component (for natural language commands)

---

## 🎨 Using All Features

### **Feature 1: Check Off Items (Basic)**

1. **Tap any checkbox** next to an item
2. Item is marked as **complete** (checkmark appears)
3. Progress counter updates automatically
4. **Tap again** to uncheck (mark incomplete)

---

### **Feature 2: Natural Language Processing (Story 0-2)**

**Location:** Bottom of ChecklistDetailView - **NLP Input** component

**Try these commands:**

#### **Create New Item:**
- Type: `"Add install light fixtures"`
- Tap **Send** or press Enter
- Preview appears showing what will be created
- Tap **Approve** to confirm
- New item appears in checklist!

#### **Mark Item Complete:**
- Type: `"Mark install cabinets as done"`
- OR: `"Complete paint walls"`
- Preview shows which item will be marked
- Tap **Approve** to confirm
- Item is marked complete!

#### **Query Status:**
- Type: `"What's left to do?"`
- OR: `"Show me incomplete items"`
- System shows list of incomplete items

**Voice Input:**
- Tap **🎤 microphone button**
- Speak your command
- Transcription appears
- Tap **Send**

---

### **Feature 3: Image Analysis (Story 0-3)**

**Location:** Bottom of ChecklistDetailView - **📷 Analyze Image for Checklist** button

**Steps:**

1. **Tap "📷 Analyze Image for Checklist"** button
2. **Enter image URL** when prompted:
   ```
   https://images.unsplash.com/photo-1586023492125-27b2c045efd7
   ```
   (This is a kitchen/construction image - perfect for testing)
3. **Wait 5-10 seconds** (GPT-4 Vision API analyzes the image)
4. **ImageAnalysisModal opens** showing:
   - **Summary**: What's visible in the image
   - **Completion Status**: complete/incomplete/partial
   - **Detected Tasks**: List of tasks AI found in image
   - **Matched Items**: Which checklist items match (with confidence scores)
   - **Suggested Updates**: "Mark 'Install cabinets' as complete?"

5. **Review suggestions:**
   - Each suggestion shows:
     - Item name
     - Confidence level (High/Medium/Low)
     - Confidence score percentage
     - Reasoning (why it matches)

6. **Approve or Reject:**
   - **Tap "Approve"** → Item marked complete + photo linked
   - **Tap "Reject"** → Suggestion dismissed

7. **Verify:**
   - Approved items show as complete in checklist
   - Photos are linked to items (visible in item details)

---

### **Feature 4: Query System (Story 0-3)**

**Location:** Bottom of ChecklistDetailView - **Query Input** component (above NLP input)

**Try these queries:**

#### **"what's next?"**
- Type or speak: `"what's next?"`
- **Result**: Shows next uncompleted task
- **Example**: "Next task: Install countertops"
- **Tap the link** to navigate to that item

#### **"show incomplete"**
- Type or speak: `"show incomplete"`
- **Result**: Lists all incomplete items
- **Example**: "Found 3 incomplete tasks: Install tiles, Paint walls, Install countertops"
- **Tap each link** to navigate

#### **"how many done?"**
- Type or speak: `"how many done?"`
- **Result**: Shows progress count
- **Example**: "2 of 5 tasks complete (40%)"

**Voice Input:**
- Tap **🎤 button** in query input
- Speak your query
- Tap **Send** button

**Query Results Display:**
- Results appear in a card above the input
- Shows answer text
- Shows links to relevant items
- Shows progress if applicable
- Tap **✕** to close results

---

## 🎬 Complete Test Scenario

### **Full End-to-End Test:**

1. **Login** → `alice@demo.com` / `password123`

2. **Open/Create Thread** → Tap any conversation

3. **Access Checklists** → Tap **✓** button in header

4. **Create Checklist:**
   - Tap "+ New Checklist"
   - Title: "Kitchen Renovation"
   - Add items:
     - "Install cabinets"
     - "Install countertops"
     - "Paint walls"
     - "Install tiles"
   - Save

5. **Open Checklist** → Tap the checklist you just created

6. **Test Basic Checkoff:**
   - Tap checkbox next to "Install tiles"
   - Verify it's marked complete
   - Progress updates to "1/4"

7. **Test Natural Language:**
   - Type: `"Add install light fixtures"`
   - Approve the preview
   - Verify new item appears
   - Type: `"Mark install cabinets as done"`
   - Approve
   - Verify item is complete

8. **Test Image Analysis:**
   - Tap "📷 Analyze Image for Checklist"
   - Enter: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7`
   - Wait for analysis
   - Review detected tasks and matches
   - Approve one suggestion
   - Verify item marked complete with photo

9. **Test Query System:**
   - Type: `"what's next?"`
   - Verify next task shown
   - Type: `"show incomplete"`
   - Verify incomplete items listed
   - Type: `"how many done?"`
   - Verify progress count

10. **Test Voice Input:**
    - Tap 🎤 in query input
    - Say: "what's next?"
    - Verify transcription and result

---

## 🗺️ Visual Navigation Map

```
┌─────────────────────────────────────┐
│  Chat List Screen                   │
│  (List of conversations)            │
└──────────────┬──────────────────────┘
               │ Tap conversation
               ▼
┌─────────────────────────────────────┐
│  Chat Screen                        │
│  (Messages + Header with buttons)    │
│  [✓] [📋] [✨]  ← Tap ✓ button      │
└──────────────┬──────────────────────┘
               │ Tap ✓ (Checklists)
               ▼
┌─────────────────────────────────────┐
│  Checklists Screen                   │
│  - "+ New Checklist" button          │
│  - List of checklists                │
└──────────────┬──────────────────────┘
               │ Tap checklist
               ▼
┌─────────────────────────────────────┐
│  ChecklistDetailView                 │
│  ┌───────────────────────────────┐  │
│  │ Checklist Items (checkboxes)  │  │
│  │ ☐ Install cabinets            │  │
│  │ ☐ Install countertops         │  │
│  │ ☑ Install tiles (complete)    │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ Query Results (if any)        │  │
│  └───────────────────────────────┘  │
│                                      │
│  [📷 Analyze Image for Checklist]    │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ Query Input                   │  │
│  │ [Text field] [🎤] [Send]      │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ NLP Input (Natural Language)  │  │
│  │ [Text field] [🎤] [Send]      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 💡 Tips & Tricks

### **Finding the Checklists Button:**
- It's in the **top-right corner** of the chat header
- Look for the **✓ (checkmark)** icon
- It's the **first button** in the header button group

### **If You Don't See Checklists:**
- Make sure you're in a **Thread/Chat** (not Chat List)
- The button only appears when viewing a conversation
- Check that you're logged in

### **Testing Image Analysis:**
- Use publicly accessible image URLs (https://)
- Construction/kitchen images work best
- Wait 5-10 seconds for analysis
- Check console logs if it fails

### **Testing Queries:**
- Simple queries work best: "what's next?", "show incomplete", "how many done?"
- Complex queries may use GPT-4 (slower)
- Voice input requires microphone permissions

### **Natural Language Commands:**
- Be specific: "Mark install cabinets as done" (better than "mark cabinets done")
- Use item titles exactly as they appear
- Preview shows what will happen before executing

---

## 🐛 Troubleshooting

### **Can't Find Checklists Button:**
- ✅ Make sure you're in a Chat/Thread view (not Chat List)
- ✅ Button is in top-right header (✓ icon)
- ✅ If still missing, check navigation setup

### **Checklist Not Creating:**
- ✅ Check Firebase emulators are running
- ✅ Check console for errors
- ✅ Verify you're logged in

### **Image Analysis Not Working:**
- ✅ Verify image URL is publicly accessible
- ✅ Check Cloud Functions are running (emulators)
- ✅ Wait 5-10 seconds for analysis
- ✅ Check console logs for errors

### **Query Not Working:**
- ✅ Make sure checklist has items
- ✅ Try simple queries first ("what's next?")
- ✅ Check console for errors

---

## ✅ Quick Checklist

Before testing, verify:
- [ ] Firebase emulators running
- [ ] Expo app running in simulator
- [ ] Logged in as user
- [ ] In a Thread/Chat view
- [ ] Can see ✓ button in header

Ready to test:
- [ ] Create checklist
- [ ] Check off items
- [ ] Use natural language commands
- [ ] Analyze images
- [ ] Query checklist status
- [ ] Use voice input

---

**Happy Testing! 🎉**

