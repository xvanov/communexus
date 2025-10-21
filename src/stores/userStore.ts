// userStore.ts - Current user state management with Zustand
// TODO: Implement user state store
import { create } from 'zustand';
import { User } from '../types/User';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: (user: User) => set({ user }),
  clearUser: () => set({ user: null }),
}));
