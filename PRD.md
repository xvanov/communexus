
Background WhatsApp transformed how billions communicate by making messaging fast, reliable, and secure. The app works seamlessly across mobile platforms, handles offline scenarios gracefully, and delivers messages instantly even on poor network connections. What's remarkable is that WhatsApp was originally built by just two developers—Brian Acton and Jan Koum—in a matter of months. They created an app that would eventually serve over 2 billion users worldwide. With today's AI coding tools, you can absolutely build a production-quality messaging app in one week—and potentially take it even further than they initially did. This required solving complex technical challenges: message persistence, real-time delivery, optimistic UI updates, efficient data sync, and cross-platform compatibility. Now imagine adding AI to this. What if your messaging app could automatically summarize long conversation threads? Or translate messages in real-time? Or provide an AI agent that helps you draft responses, schedule messages, or extract action items from group chats? This project challenges you to build both a production-quality messaging infrastructure—like WhatsApp—and AI features that enhance the messaging experience using LLMs, agents, and RAG pipelines. Why This Matters The future of messaging isn't just about sending texts—it's about intelligent communication. You'll be building the foundation for how AI can make conversations more productive, accessible, and meaningful. Project Overview This is a one-week sprint with three key deadlines: MVP: Tuesday (24 hours) Early Submission: Friday (4 days) Final: Sunday (7 days) You'll build in two phases: first the core messaging infrastructure with real-time sync and offline support, then AI features tailored to a specific user persona. MVP Requirements (24 Hours) This is a hard gate. To pass the MVP checkpoint, you must have: One-on-one chat functionality Real-time message delivery between 2+ users Message persistence (survives app restarts) Optimistic UI updates (messages appear instantly before server confirmation) Online/offline status indicators Message timestamps User authentication (users have accounts/profiles) Basic group chat functionality (3+ users in one conversation) Message read receipts Push notifications working (at least in foreground) Deployment: Running on local emulator/simulator with deployed backend (TestFlight/APK/Expo Go if possible, but not required for MVP) The MVP isn't about features—it's about proving your messaging infrastructure is solid. A simple chat app with reliable message delivery is worth more than a feature-rich app with messages that don't sync reliably. Platform Requirements Choose ONE of the following: Swift (iOS native) - SwiftUI or UIKit Kotlin (Android native) - Jetpack Compose or XML React Native with Expo - Must use Expo Go or custom dev client Core Messaging Infrastructure Essential Features Your messaging app needs one-on-one chat with real-time message delivery. Messages must persist locally—users should see their chat history even when offline. Support text messages with timestamps and read receipts. Implement online/offline presence indicators. Show when users are typing. Handle message delivery states: sending, sent, delivered, read. Include basic media support—at minimum, users should be able to send and receive images. Add profile pictures and display names. Build group chat functionality supporting 3+ users with proper message attribution and delivery tracking. Real-Time Messaging Every message should appear instantly for online recipients. When users go offline, messages queue and send when connectivity returns. The app must handle poor network conditions gracefully—3G, packet loss, intermittent connectivity. Implement optimistic UI updates. When users send a message, it appears immediately in their chat, then updates with delivery confirmation. Messages never get lost—if the app crashes mid-send, the message should still go out. Testing Scenarios We'll test with: Two devices chatting in real-time One device going offline, receiving messages, then coming back online Messages sent while app is backgrounded App force-quit and reopened to verify persistence Poor network conditions (airplane mode, throttled connection) Rapid-fire messages (20+ messages sent quickly) Group chat with 3+ participants Persona Who They Are Core Pain Points Required AI Features (All 5) Advanced Features (Only 1) Service Business Operator Independent property managers, landlords, or small-business contractors who coordinate with tenants, clients, and vendors through text, email, and phone. • Fragmented communication across SMS, email, and chat apps • Missed messages or decisions due to context overload • Manual follow-ups and lost task tracking • Difficulty organizing documentation and agreements 1. Thread Summarization: Condenses long tenant or client conversations into key points. 2. Action Item Extraction: Identifies to-dos such as “schedule plumber” or “collect rent.” 3. Smart Search: Retrieves any message or attachment by intent or keyword across all channels. 4. Priority Message Detection: Flags urgent issues (e.g., leaks, payment delays). 5. Decision Tracking: Records agreements or instructions for easy reference and dispute protection. A) Proactive Assistant: Detects follow-up needs (e.g., rent reminders, maintenance confirmations) and automatically drafts or schedules responses.

You are a senior software engineer building **Communexus** — a minimal, production-quality messaging app for iOS that meets the MVP standards of a WhatsApp-like system.

## PURPOSE
Communexus centralizes communication for small business operators such as landlords, property managers, and contractors. The goal is to make reliable, real-time messaging available with minimal setup while ensuring messages persist, sync instantly, and handle offline use gracefully.

## MVP REQUIREMENTS
Implement a fully functional mobile app prototype that achieves the following:

1. **User Accounts**
   - Users can register and log in.
   - Each user has a profile with name, photo, and online status.

2. **One-on-One Chat**
   - Real-time message delivery between two users.
   - Messages appear instantly (optimistic UI).
   - Delivery confirmations and read receipts visible to sender.

3. **Group Chat**
   - Support at least one group conversation with three or more participants.
   - Each message shows sender identity and timestamp.

4. **Message Persistence**
   - Chat history survives app restarts.
   - Messages sync automatically when user reconnects.

5. **Offline Handling**
   - Messages created offline queue automatically.
   - Queued messages send when connectivity returns.

6. **Presence & Typing Indicators**
   - Show when participants are online/offline or typing.

7. **Push Notifications**
   - Foreground push notifications for new messages.

8. **Media Messages**
   - Support sending and receiving image attachments.

9. **Resilience**
   - App must handle poor network conditions (e.g., throttled or lost connections) without losing data.
   - Rapid-fire messaging (20+ consecutive sends) must remain stable.

10. **Deployment**
   - Runnable on iOS simulator and installable on a real device.
   - Ready for submission or internal testing build (TestFlight optional).

## DESIGN & EXPERIENCE
- Minimal and modern interface inspired by WhatsApp or iMessage.
- Clean message bubbles with timestamps and sender avatars.
- Simple thread list showing latest message preview and unread state.
- Intuitive navigation and input bar for messages.

## VALIDATION SCENARIOS
- Two users exchange messages in real time.
- One user goes offline, messages are queued and delivered upon reconnection.
- App force-quit and relaunched → all messages still visible.
- Group chat supports 3+ users with accurate attribution.
- Read receipts update correctly after viewing a thread.

## OUTPUT EXPECTATIONS
- Generate all required files and configurations for a runnable iOS app.
- Include inline documentation for each core component.
- End with a “How to Run” guide outlining build steps, testing flow, and where to plug in backend credentials if needed.
- Ensure the app meets all MVP conditions above.

Begin building **Communexus** now.

