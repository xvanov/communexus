// chatStore.ts - Active thread and draft messages
// TODO: Implement chat state store
import { create } from 'zustand';
import { Thread } from '../types/Thread';

interface ChatState {
  activeThread: Thread | null;
  draftMessages: Record<string, string>;
  setActiveThread: (thread: Thread) => void;
  setDraftMessage: (threadId: string, message: string) => void;
}

export const useChatStore = create<ChatState>(set => ({
  activeThread: null,
  draftMessages: {},
  setActiveThread: (thread: Thread) => set({ activeThread: thread }),
  setDraftMessage: (threadId: string, message: string) =>
    set(state => ({
      draftMessages: { ...state.draftMessages, [threadId]: message },
    })),
}));
