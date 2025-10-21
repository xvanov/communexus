// chatStore.ts - Active thread and draft messages
// TODO: Implement chat state store
import { create } from 'zustand';

interface ChatState {
  activeThread: any | null;
  draftMessages: Record<string, string>;
  setActiveThread: (thread: any) => void;
  setDraftMessage: (threadId: string, message: string) => void;
}

export const useChatStore = create<ChatState>(set => ({
  activeThread: null,
  draftMessages: {},
  setActiveThread: thread => set({ activeThread: thread }),
  setDraftMessage: (threadId, message) =>
    set(state => ({
      draftMessages: { ...state.draftMessages, [threadId]: message },
    })),
}));
