// offlineStore.ts - Pending messages queue
// TODO: Implement offline state store
import { create } from 'zustand';

interface OfflineState {
  pendingMessages: any[];
  isOffline: boolean;
  addPendingMessage: (message: any) => void;
  removePendingMessage: (messageId: string) => void;
  setOfflineStatus: (isOffline: boolean) => void;
}

export const useOfflineStore = create<OfflineState>(set => ({
  pendingMessages: [],
  isOffline: false,
  addPendingMessage: message =>
    set(state => ({
      pendingMessages: [...state.pendingMessages, message],
    })),
  removePendingMessage: messageId =>
    set(state => ({
      pendingMessages: state.pendingMessages.filter(
        msg => msg.id !== messageId
      ),
    })),
  setOfflineStatus: isOffline => set({ isOffline }),
}));
