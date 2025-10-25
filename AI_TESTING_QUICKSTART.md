# 🧪 AI Testing - Quick Start Guide

**Ready to test?** Follow this guide step-by-step!

---

## ✅ Pre-Test Checklist

Before you start, make sure you have:

- [ ] Firebase emulators running (`npx firebase emulators:start`)
- [ ] Expo app running on iPhone 15 simulator
- [ ] Signed in as Alice or Bob (demo users)
- [ ] OpenAI API key in `functions/.env` and `functions/.env.local`
- [ ] This testing guide open

---

## 🎯 Test Session: Thread Summarization

We're going to test the ONLY integrated feature first (Thread Summarization) with progressively complex conversations.

### Test 1: Simple 3-Message Conversation (5 mins)

**Goal**: Verify basic functionality works

**Steps**:

1. Open the app (signed in as Bob)
2. Tap "Alice Johnson" contact to open conversation
3. Send these 3 messages (press send after each):
   ```
   Message 1: "Hey Alice, how's the project coming along?"
   Message 2: "Can you send me the updated designs by Friday?"
   Message 3: "Thanks! Looking forward to reviewing them."
   ```
4. Tap the **✨ AI** button in the header
5. Wait for the summary modal to appear

**What to check**:

- ✅ Loading indicator appears immediately
- ✅ Summary appears within 2-5 seconds
- ✅ Modal shows summary text
- ✅ Can see key points section
- ✅ Can see action items section (should mention "send designs by Friday")
- ✅ Modal can be closed with ✕ button

**Take notes**: Does the summary make sense? Is it accurate?

---

### Test 2: Action Items Conversation (5 mins)

**Goal**: Test if AI extracts action items correctly

**Steps**:

1. In the same conversation, send these messages:
   ```
   Message 4: "Also, please review the PR I sent yesterday"
   Message 5: "And can you schedule a meeting with the team for next week?"
   Message 6: "Sure, I'll take care of all of that"
   ```
2. Tap **✨ AI** button again
3. Wait for new summary

**What to check**:

- ✅ Summary includes ALL 6 messages
- ✅ Action items section lists:
  - Send designs by Friday
  - Review PR
  - Schedule team meeting
- ✅ Summary is coherent and well-organized

**Take notes**: Are all action items captured? Any missed?

---

### Test 3: Decisions Conversation (5 mins)

**Goal**: Test if AI recognizes decisions

**Steps**:

1. Start a NEW conversation (tap ← back, then start new with Charlie or create group)
2. Send these messages:
   ```
   Message 1: "I've been thinking about which database to use"
   Message 2: "We have three options: MySQL, PostgreSQL, or MongoDB"
   Message 3: "I think PostgreSQL is the best choice for our needs"
   Message 4: "Agreed, let's go with PostgreSQL"
   Message 5: "Great! I'll set it up this week"
   ```
3. Tap **✨ AI** button

**What to check**:

- ✅ Summary captures the decision (PostgreSQL chosen)
- ✅ Shows reasoning (best for needs)
- ✅ Identifies outcome (will set up this week)
- ✅ Key points include the decision

**Take notes**: Does the summary clearly state what was decided?

---

### Test 4: Error Handling (3 mins)

**Goal**: Verify error handling works

**Steps**:

1. **Stop the Firebase emulator** (Ctrl+C in emulator terminal)
2. In the app, tap **✨ AI** button
3. Observe what happens

**What to check**:

- ✅ Error message appears (should say connection failed or similar)
- ✅ "Retry" button is visible
- ✅ App doesn't crash
- ✅ Can close the modal with ✕

**Then**: 4. **Restart Firebase emulator** (`npx firebase emulators:start`) 5. Wait for "All emulators ready!" 6. In app, tap "Retry" button

**What to check**:

- ✅ Retry works and gets summary
- ✅ Or shows clear error if still can't connect

---

### Test 5: Performance Test - Long Conversation (10 mins)

**Goal**: Test with realistic message count

**Steps**:

1. Create a new conversation or use existing
2. Send 15-20 messages covering different topics:

   ```
   Messages 1-3: Initial hello and project status
   Messages 4-7: Discussion about timeline and deadlines
   Messages 8-11: Technical decisions (which tool to use)
   Messages 12-15: Action items and next steps
   Messages 16-20: Follow-up questions and confirmations
   ```

   (Don't worry about exact wording, just create a realistic back-and-forth)

3. Tap **✨ AI** button
4. **TIME IT** - note how long it takes

**What to check**:

- ✅ Response time < 10 seconds (ideally < 5)
- ✅ Summary is CONCISE (not just repeating everything)
- ✅ Key decisions highlighted
- ✅ Action items extracted
- ✅ Next steps clear
- ✅ UI doesn't freeze or stutter

**Take notes**: How long did it take? Is the summary useful or too verbose?

---

## 🧪 Backend Testing (Optional but Recommended)

If you want to test the other 4 AI features' backends before integrating them:

### Quick Backend Test

1. **Open a new terminal**
2. **Test Action Item Extraction**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiActionExtraction \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "threadId": "test-123",
      "messages": [
        {"text": "Please send the report by Friday", "sender": "Alice"},
        {"text": "Can you review the PR by EOD?", "sender": "Bob"}
      ]
    }
  }'
```

**Expected**: Should return JSON with action items extracted

3. **Test Priority Detection**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiPriorityDetection \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "text": "URGENT: Server is down!"
    }
  }'
```

**Expected**: Should return priority = "high"

4. **Test Smart Search**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiSmartSearch \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "query": "project deadline",
      "messages": [
        {"id": "1", "text": "When is the project due?"},
        {"id": "2", "text": "The deadline is Friday"}
      ]
    }
  }'
```

**Expected**: Should return both messages with relevance scores

5. **Test Proactive Agent**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiProactiveAgent \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "recentMessages": [
        {"text": "Can you send the report?", "sender": "Alice"}
      ],
      "context": "Report was promised but not sent"
    }
  }'
```

**Expected**: Should return suggestions for follow-up

---

## 📊 Results Template

After testing, fill this out:

### Thread Summarization Results

| Test               | Pass/Fail | Notes | Response Time |
| ------------------ | --------- | ----- | ------------- |
| Simple 3-msg       | ⏳        |       |               |
| Action items       | ⏳        |       |               |
| Decisions          | ⏳        |       |               |
| Error handling     | ⏳        |       |               |
| Long convo (15-20) | ⏳        |       |               |

### Overall Assessment

**What worked well**:

-

## **Issues found**:

**Ready for remaining integration?**: YES / NO / NEEDS FIXES

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅:

1. Document results in `AI_TESTING_PLAN.md`
2. Proceed with integrating remaining 4 features
3. Test each feature as you integrate it

### If Tests Fail ❌:

1. Document specific failures
2. Fix critical issues first
3. Re-test before proceeding
4. Create GitHub issues for non-blocking problems

---

## 💡 Testing Tips

- **Be Patient**: AI responses take 2-5 seconds, that's normal
- **Be Realistic**: Create actual conversations, not just "test test test"
- **Be Thorough**: Try edge cases (empty, very long, special characters)
- **Take Screenshots**: Capture any errors or unexpected behavior
- **Note Performance**: Keep track of response times

---

## ❓ Troubleshooting

### "Error: not-found" or "Error: Failed to fetch"

- **Fix**: Check Firebase emulators are running
- **Fix**: Reload app (press 'r' in Metro terminal)

### "Missing credentials" or OpenAI error

- **Fix**: Check `functions/.env` and `functions/.env.local` have `OPENAI_API_KEY`
- **Fix**: Restart emulators after adding env vars

### App crashes or freezes

- **Fix**: Check Metro logs for errors
- **Fix**: Check emulator logs
- **Fix**: Try killing and restarting app

### Summary seems wrong or incomplete

- **Normal**: AI isn't perfect, especially with very short conversations
- **Check**: Does it improve with longer, more substantive conversations?

---

**Ready to Start?**

1. Make sure emulators are running ✅
2. Make sure app is open and signed in ✅
3. Follow Test 1 above ⬆️
4. Have fun! 🎉

**Time Estimate**: 30-45 minutes for complete testing session

**Questions?** Just ask! 💬
