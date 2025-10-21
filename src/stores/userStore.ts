// userStore.ts - Current user state management with Zustand
// TODO: Implement user state store
import { create } from 'zustand';

interface UserState {
  user: any | null;
  setUser: (user: any) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: user => set({ user }),
  clearUser: () => set({ user: null }),
}));
