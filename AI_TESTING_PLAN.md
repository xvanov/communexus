# AI Features Testing Plan

**Date**: October 24, 2025  
**Status**: 🧪 Testing in Progress  
**Branch**: `001-notifications-system`

---

## 🎯 Testing Strategy

### Phase 1: Component Testing ✅ (Current)

Test the only integrated feature (Thread Summarization) thoroughly with real conversations.

### Phase 2: Backend Testing

Test all Cloud Functions directly via curl/Postman to verify they work.

### Phase 3: Integration Testing

After integrating remaining features, test end-to-end flows.

---

## 📋 Test Plan

### Test 1: Thread Summarization (Currently Integrated) 🎯

**Status**: ✅ Partially Working (tested with 1 message)  
**Component**: SummaryModal  
**Cloud Function**: aiThreadSummary  
**Location**: ChatScreen → ✨ AI button

#### Test Cases

##### TC1.1: Short Conversation (2-3 messages) ⏳ TO TEST

**Steps**:

1. Open existing conversation with Bob
2. Send 2-3 simple messages:
   - "Hey Bob, how's the project going?"
   - "Can you send me the updated designs?"
   - "Thanks, looking forward to seeing them!"
3. Click ✨ AI button
4. Wait for summary to load

**Expected**:

- Loading indicator appears
- Summary generated within 2-3 seconds
- Summary contains: Main topic, key points
- No errors displayed

**Actual**: _[To be filled during testing]_

---

##### TC1.2: Conversation with Action Items ⏳ TO TEST

**Steps**:

1. Send messages containing action items:
   - "Please send the report by Friday"
   - "Can you review the PR by EOD?"
   - "Let's schedule a meeting next week"
2. Click ✨ AI button

**Expected**:

- Summary identifies the action items
- Action items listed separately
- Clear description of each action

**Actual**: _[To be filled during testing]_

---

##### TC1.3: Conversation with Decisions ⏳ TO TEST

**Steps**:

1. Send messages about decisions:
   - "I think we should go with option B"
   - "Agreed, option B is the best choice"
   - "Great, I'll inform the team"
2. Click ✨ AI button

**Expected**:

- Summary captures the decision made
- Identifies decision-makers
- Shows outcome

**Actual**: _[To be filled during testing]_

---

##### TC1.4: Long Conversation (15+ messages) ⏳ TO TEST

**Steps**:

1. Create conversation with 15+ messages covering:
   - Initial question
   - Discussion/back-and-forth
   - Decisions made
   - Action items assigned
   - Next steps
2. Click ✨ AI button

**Expected**:

- Handles long conversation gracefully
- Summary is concise (not just repeating everything)
- Key points highlighted
- Action items extracted
- Response time < 5 seconds

**Actual**: _[To be filled during testing]_

---

##### TC1.5: Error Handling ⏳ TO TEST

**Steps**:

1. Stop Firebase emulator
2. Click ✨ AI button
3. Observe error

**Expected**:

- Error message displays clearly
- "Retry" button appears
- No app crash
- Can close modal

**Actual**: _[To be filled during testing]_

---

##### TC1.6: Empty/No Messages ⏳ TO TEST

**Steps**:

1. Open new conversation (no messages)
2. Click ✨ AI button

**Expected**:

- Shows "No messages to summarize"
- Or disabled state
- No error

**Actual**: _[To be filled during testing]_

---

### Test 2: Action Item Extraction (Backend Only) 🔧

**Status**: ⏳ Not Yet Integrated  
**Cloud Function**: aiActionExtraction  
**Test Method**: Direct API call via curl

#### TC2.1: Extract Action Items via curl

**Command**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiActionExtraction \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "threadId": "test-123",
      "messages": [
        {"text": "Please send the report by Friday", "sender": "Alice"},
        {"text": "Can you review the PR by EOD?", "sender": "Bob"},
        {"text": "I will do it tomorrow", "sender": "Alice"}
      ]
    }
  }'
```

**Expected Response**:

```json
{
  "result": {
    "success": true,
    "actionItems": [
      {
        "task": "Send the report",
        "priority": "medium",
        "assignedTo": "Unknown"
      },
      {
        "task": "Review the PR",
        "priority": "high",
        "assignedTo": "Unknown"
      }
    ]
  }
}
```

**Actual**: _[To be tested]_

---

### Test 3: Priority Detection (Backend Only) 🔧

**Status**: ⏳ Not Yet Integrated  
**Cloud Function**: aiPriorityDetection

#### TC3.1: Detect High Priority

**Command**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiPriorityDetection \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "text": "URGENT: Server is down and customers cannot access the site!"
    }
  }'
```

**Expected**: Priority = "high", Confidence > 0.8

---

#### TC3.2: Detect Low Priority

**Command**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiPriorityDetection \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "text": "Hey, just checking in. How was your weekend?"
    }
  }'
```

**Expected**: Priority = "low", Confidence > 0.7

---

### Test 4: Smart Search (Backend Only) 🔧

**Status**: ⏳ Not Yet Integrated  
**Cloud Function**: aiSmartSearch

#### TC4.1: Search for Topic

**Command**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiSmartSearch \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "query": "project deadline",
      "threadIds": ["thread-123"],
      "messages": [
        {"id": "1", "text": "When is the project due?", "sender": "Alice"},
        {"id": "2", "text": "The deadline is next Friday", "sender": "Bob"},
        {"id": "3", "text": "What time is lunch?", "sender": "Charlie"}
      ]
    }
  }'
```

**Expected**: Returns messages 1 and 2 with high relevance, not message 3

---

### Test 5: Proactive Agent (Backend Only) 🔧

**Status**: ⏳ Not Yet Integrated  
**Cloud Function**: aiProactiveAgent

#### TC5.1: Get Suggestions

**Command**:

```bash
curl -X POST http://127.0.0.1:5001/communexus/us-central1/aiProactiveAgent \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "recentMessages": [
        {"text": "Can you send me the report?", "sender": "Alice"},
        {"text": "Sure, I will send it by EOD", "sender": "Bob"}
      ],
      "userContext": "Bob has not sent the report yet",
      "threadContext": "Report was promised for today"
    }
  }'
```

**Expected**: Suggestion to follow up or reminder about report

---

## 🧪 Testing Session Guide

### Setup (Before Testing)

1. **Start Firebase Emulators**:

```bash
cd /Users/kalin.ivanov/rep/communexus/main
npx firebase emulators:start
```

2. **Verify Emulator Status**:

- Check logs show: `✔ All emulators ready!`
- Verify: `OpenAI API key is required` warning is gone (should show in logs but not block execution)

3. **Start Expo App**:

```bash
npx expo run:ios --device "iPhone 15"
```

4. **Sign in as Demo User**:

- Use Alice or Bob
- Create/open conversation

---

### During Testing

**For Each Test Case**:

1. ✍️ Write down what you're testing
2. 📸 Take screenshot if relevant
3. ⏱️ Note response time
4. ✅ Mark pass/fail
5. 📝 Document any issues

**What to Look For**:

- ✅ **Correctness**: Is the AI response accurate?
- ⚡ **Performance**: Response time < 5 seconds?
- 🎨 **UI**: Clean layout, no overlaps?
- 🐛 **Errors**: Any crashes or freezes?
- 📱 **UX**: Smooth animations, clear feedback?

---

### After Testing

**Document Results**:

1. Update this file with actual results
2. Create list of issues found
3. Prioritize fixes (P0, P1, P2)
4. Create GitHub issues if needed

**Success Criteria**:

- ✅ Thread Summarization works with 5+ message conversations
- ✅ Response time < 5 seconds
- ✅ Error handling works (retry, close)
- ✅ UI is clean and professional
- ✅ No crashes or app freezes

**If All Pass**: Ready to integrate remaining 4 features! 🚀

---

## 📊 Test Results Summary

### Overview

- **Total Tests**: 11
- **Passed**: 0 ⏳
- **Failed**: 0 ⏳
- **Blocked**: 0 ⏳
- **Not Run**: 11 ⏳

### By Feature

| Feature        | Backend Tests | Frontend Tests | Status          |
| -------------- | ------------- | -------------- | --------------- |
| Thread Summary | -             | 0/6            | ⏳ Testing      |
| Action Items   | 0/1           | -              | ⏳ Backend Only |
| Priority       | 0/2           | -              | ⏳ Backend Only |
| Smart Search   | 0/1           | -              | ⏳ Backend Only |
| Proactive      | 0/1           | -              | ⏳ Backend Only |

---

## 🐛 Issues Found

### Critical (P0) - Blocks Release

_[None yet]_

### High (P1) - Should Fix Before Launch

_[None yet]_

### Medium (P2) - Nice to Have

_[None yet]_

### Low (P3) - Future Enhancement

_[None yet]_

---

## 📝 Testing Notes

### Session 1: October 24, 2025

**Tested By**: AI Assistant  
**Duration**: _[In Progress]_  
**Environment**:

- Device: iPhone 15 Simulator
- iOS: Latest
- Firebase: Emulator
- OpenAI: Real API (dev)

**Notes**:
_[Add observations here during testing]_

---

**Next Update**: After completing Test 1 (Thread Summarization)
