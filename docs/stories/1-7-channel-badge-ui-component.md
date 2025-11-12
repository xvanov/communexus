# Story 1.7: Channel Badge UI Component

Status: ready-for-dev

## Story

As a property manager,
I want to see which channel each message came from,
so that I can understand the communication context.

## Acceptance Criteria

1. ChannelBadge component created with channel icons (📱 SMS, 💬 Messenger, 📧 Email)
2. Component displays channel type and identifier (phone number, email, name)
3. Component shows direction (incoming/outgoing)
4. Component integrated into message list
5. Component styled consistently with app design
6. Component accessible (screen reader support)
7. Component responsive (mobile and desktop)

## Tasks / Subtasks

- [ ] Task 1: Enhance ChannelBadge component styling and layout (AC: 1, 5)
  - [ ] Review existing `src/components/common/ChannelBadge.tsx` implementation
  - [ ] Enhance visual styling to make badge more prominent and visually distinct
  - [ ] Add badge background styling with proper colors and borders
  - [ ] Ensure badge styling matches app design system (Colors, Spacing, Typography)
  - [ ] Add hover/press states for interactive badges (if needed)
  - [ ] Test badge appearance on different screen sizes

- [ ] Task 2: Enhance ChannelBadge to display channel type and identifier prominently (AC: 2)
  - [ ] Update ChannelBadge to show channel name (SMS, Messenger, Email) alongside icon
  - [ ] Display identifier (phone number, email, Facebook ID) in readable format
  - [ ] Use DirectionIndicator component for identifier display (already integrated)
  - [ ] Format phone numbers using E.164 to display format conversion
  - [ ] Format email addresses appropriately (truncate if too long)
  - [ ] Handle Facebook IDs appropriately (may show as "Messenger" if ID is not user-friendly)
  - [ ] Add truncation for long identifiers with ellipsis

- [ ] Task 3: Ensure direction display is clear and prominent (AC: 3)
  - [ ] Verify DirectionIndicator component is properly integrated
  - [ ] Ensure direction text is readable and visually distinct
  - [ ] Consider adding visual indicators (arrows, icons) for direction
  - [ ] Test direction display for both incoming and outgoing messages
  - [ ] Ensure direction text aligns with accessibility requirements

- [ ] Task 4: Integrate ChannelBadge into message list components (AC: 4)
  - [ ] Review `src/components/chat/MessageBubble.tsx` current implementation
  - [ ] Replace or enhance existing channel indicator display with full ChannelBadge
  - [ ] Ensure ChannelBadge is displayed for each message in the list
  - [ ] Position ChannelBadge appropriately (above message bubble, consistent with Story 1.4)
  - [ ] Update `src/screens/ChatScreen.tsx` if needed to support ChannelBadge display
  - [ ] Test ChannelBadge display in message list with messages from multiple channels
  - [ ] Ensure ChannelBadge doesn't interfere with message readability

- [ ] Task 5: Ensure consistent styling with app design system (AC: 5)
  - [ ] Review app design system (Colors, Spacing, Typography from `src/utils/theme.ts`)
  - [ ] Ensure ChannelBadge uses theme colors and spacing consistently
  - [ ] Match badge styling with other UI components (buttons, cards, etc.)
  - [ ] Ensure badge sizes are appropriate for different screen sizes
  - [ ] Test badge appearance in light and dark modes (if supported)
  - [ ] Verify badge styling matches existing MessageBubble and ThreadItem components

- [ ] Task 6: Implement accessibility support (AC: 6)
  - [ ] Review existing accessibility implementation in ChannelBadge component
  - [ ] Ensure accessibility labels are descriptive and include channel type and direction
  - [ ] Test with screen readers (React Native accessibility features)
  - [ ] Ensure badge is keyboard navigable (if interactive)
  - [ ] Add accessibility hints for channel context
  - [ ] Test accessibility with VoiceOver (iOS) and TalkBack (Android)
  - [ ] Verify accessibility labels match visual content

- [ ] Task 7: Ensure responsive design for mobile and desktop (AC: 7)
  - [ ] Test ChannelBadge on mobile devices (small screens, different orientations)
  - [ ] Test ChannelBadge on tablet and desktop sizes (if applicable)
  - [ ] Ensure badge sizing scales appropriately for different screen sizes
  - [ ] Test badge layout with different text lengths (short and long identifiers)
  - [ ] Verify badge doesn't overflow or break layout on small screens
  - [ ] Test badge with multiple messages in list (performance with many badges)
  - [ ] Ensure touch targets are appropriate size for mobile interaction

- [ ] Task 8: Update ChannelBadge to use IdentityService for name resolution (AC: 2)
  - [ ] Review `src/services/identity.ts` and `src/hooks/useIdentity.ts`
  - [ ] Integrate IdentityService to resolve identifiers to user names when available
  - [ ] Update ChannelBadge to show user name instead of identifier when identity is linked
  - [ ] Fallback to identifier display when name is not available
  - [ ] Handle loading states when resolving identity
  - [ ] Cache resolved names to avoid repeated lookups
  - [ ] Test name resolution with different identifier types (phone, email, Facebook ID)

- [ ] Task 9: Write unit tests for ChannelBadge component (All ACs)
  - [ ] Create test file: `src/components/common/__tests__/ChannelBadge.test.tsx`
  - [ ] Test ChannelBadge renders with correct channel icon
  - [ ] Test ChannelBadge displays channel type and identifier
  - [ ] Test ChannelBadge shows direction correctly (incoming/outgoing)
  - [ ] Test ChannelBadge handles different identifier formats (phone, email, Facebook ID)
  - [ ] Test ChannelBadge accessibility labels
  - [ ] Test ChannelBadge with different sizes (small, medium, large)
  - [ ] Test ChannelBadge with identity resolution (name display)
  - [ ] Test ChannelBadge with missing identity (fallback to identifier)

- [ ] Task 10: Integration testing with message list (AC: 4)
  - [ ] Test ChannelBadge display in MessageBubble component
  - [ ] Test ChannelBadge with messages from multiple channels in same thread
  - [ ] Test ChannelBadge with messages from single channel
  - [ ] Test ChannelBadge with long identifiers (truncation)
  - [ ] Test ChannelBadge performance with large message lists
  - [ ] Test ChannelBadge with channel filter active (Story 1.4)
  - [ ] Write integration tests for ChannelBadge in message list context

- [ ] Task 11: Documentation and code cleanup (All ACs)
  - [ ] Update JSDoc comments in ChannelBadge component
  - [ ] Document ChannelBadge props and usage examples
  - [ ] Update component exports in common/index.ts if needed
  - [ ] Review and clean up any commented code
  - [ ] Ensure all TypeScript types are properly exported
  - [ ] Update architecture.md with ChannelBadge component documentation (if needed)

## Dev Notes

This story enhances the ChannelBadge component that was created in Story 1.4. The basic version exists but needs enhancement to meet all acceptance criteria, particularly around styling, identifier display, and full integration into the message list.

### Key Technical Decisions

1. **Enhancement vs. Recreation**: The ChannelBadge component already exists from Story 1.4, so this story focuses on enhancement rather than creating from scratch. The existing implementation provides a foundation but needs styling improvements and better identifier display.

2. **Identifier Display**: The badge should display identifiers in a human-readable format (formatted phone numbers, readable email addresses). When identity is linked, it should show the user's name instead of the identifier.

3. **Styling Consistency**: The badge must match the app's design system and be visually distinct but not overwhelming. It should complement the message bubble without interfering with readability.

4. **Accessibility First**: The badge must be fully accessible with descriptive labels that include channel type, direction, and identifier information.

### Architecture Alignment

- **Component Structure**: Uses existing `ChannelIcon` and `DirectionIndicator` components from Story 1.4
- **Identity Resolution**: Integrates with `IdentityService` from Story 1.3 for name resolution
- **Message Display**: Integrates with `MessageBubble` component from Story 1.4
- **Design System**: Follows app theme from `src/utils/theme.ts`
- **Type Safety**: Uses `ChannelType` from `src/types/Channel.ts` (Story 1.1)

### Dependencies

- **Story 1.1**: Channel Abstraction Interface Design - Provides ChannelType and channel types
- **Story 1.3**: Identity Linking System - Provides IdentityService for name resolution
- **Story 1.4**: Unified Thread Model with Channel Support - Provides ChannelIcon, DirectionIndicator, and basic ChannelBadge implementation

### Project Structure Notes

- **ChannelBadge Component**: `src/components/common/ChannelBadge.tsx` - Enhance existing component
- **ChannelIcon Component**: `src/components/common/ChannelIcon.tsx` - Already exists, use as-is
- **DirectionIndicator Component**: `src/components/common/DirectionIndicator.tsx` - Already exists, use as-is
- **MessageBubble Component**: `src/components/chat/MessageBubble.tsx` - Update to use enhanced ChannelBadge
- **ChatScreen Component**: `src/screens/ChatScreen.tsx` - May need updates for ChannelBadge integration
- **Identity Service**: `src/services/identity.ts` - Use for name resolution
- **Identity Hooks**: `src/hooks/useIdentity.ts` - Use for identity lookup in components

**No Conflicts Detected**: This story enhances existing components without breaking changes.

### Learnings from Previous Story

**From Story 1.4: Unified Thread Model with Channel Support (Status: review)**

- **New Components Created**: 
  - `ChannelIcon.tsx` available at `src/components/common/ChannelIcon.tsx` - Use for channel icons in badge
  - `DirectionIndicator.tsx` available at `src/components/common/DirectionIndicator.tsx` - Use for direction display in badge
  - `ChannelBadge.tsx` available at `src/components/common/ChannelBadge.tsx` - Basic version exists, needs enhancement
  
- **Component Integration**: 
  - ChannelBadge already integrated into MessageBubble component (basic version)
  - Channel indicators displayed above message bubble
  - Filter integration in ChatScreen already complete
  
- **Styling Approach**: 
  - Components use theme utilities from `src/utils/theme.ts` (Colors, Spacing)
  - Accessibility labels included in all components
  - Components follow React Native component patterns
  
- **Technical Notes**: 
  - ChannelBadge component note mentions "Full channel badge implementation will be in Story 1.7" - this is that story
  - Basic ChannelBadge combines ChannelIcon and DirectionIndicator but needs styling and identifier display enhancements
  - DirectionIndicator already handles phone number formatting (E.164 to display format)
  
- **Review Findings**: 
  - Story 1.4 review noted ChannelBadge doesn't use TouchableOpacity as mentioned in Task 9 subtask, but this is acceptable as component doesn't need interactivity
  - Unit tests for UI components are documented as missing but non-blocking (Task 15)
  
- **Pending Review Items**: 
  - Unit tests for ChannelBadge component (Task 15) - should be included in this story's testing tasks
  
- **Architectural Decisions**: 
  - Channel fields are optional for backward compatibility
  - All components include accessibility support
  - Components use TypeScript types from Channel.ts

[Source: docs/stories/1-4-unified-thread-model-with-channel-support.md#Dev-Agent-Record]

### References

- [Source: docs/epics.md#Story-1.7] - Story requirements and acceptance criteria
- [Source: docs/architecture.md#Phase-3.1-Multi-Channel-Foundation] - Channel abstraction architecture
- [Source: docs/architecture.md#Data-Architecture] - Extended Message and Thread data models
- [Source: docs/PRD-Phase3-Addendum.md#Feature-3.1-Multi-Channel-Messaging-Wrapper] - Multi-channel messaging requirements
- [Source: src/components/common/ChannelBadge.tsx] - Existing ChannelBadge component (basic version)
- [Source: src/components/common/ChannelIcon.tsx] - ChannelIcon component from Story 1.4
- [Source: src/components/common/DirectionIndicator.tsx] - DirectionIndicator component from Story 1.4
- [Source: src/components/chat/MessageBubble.tsx] - MessageBubble component that uses ChannelBadge
- [Source: src/services/identity.ts] - IdentityService for name resolution
- [Source: src/hooks/useIdentity.ts] - Identity hooks for component integration
- [Source: src/types/Channel.ts] - ChannelType and channel types from Story 1.1
- [Source: src/types/Message.ts] - Message interface with channel fields from Story 1.4
- [Source: docs/stories/1-1-channel-abstraction-interface-design.md] - Channel abstraction interface design
- [Source: docs/stories/1-3-identity-linking-system.md] - Identity linking system implementation
- [Source: docs/stories/1-4-unified-thread-model-with-channel-support.md] - Unified thread model implementation

## Dev Agent Record

### Context Reference

- docs/stories/1-7-channel-badge-ui-component.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

