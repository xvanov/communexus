// offlineStore.ts - Pending messages queue
// TODO: Implement offline state store
import { create } from 'zustand';
import { Message } from '../types/Message';

interface OfflineState {
  pendingMessages: Message[];
  isOffline: boolean;
  addPendingMessage: (message: Message) => void;
  removePendingMessage: (messageId: string) => void;
  setOfflineStatus: (isOffline: boolean) => void;
}

export const useOfflineStore = create<OfflineState>(set => ({
  pendingMessages: [],
  isOffline: false,
  addPendingMessage: (message: Message) =>
    set(state => ({
      pendingMessages: [...state.pendingMessages, message],
    })),
  removePendingMessage: (messageId: string) =>
    set(state => ({
      pendingMessages: state.pendingMessages.filter(
        msg => msg.id !== messageId
      ),
    })),
  setOfflineStatus: (isOffline: boolean) => set({ isOffline }),
}));
