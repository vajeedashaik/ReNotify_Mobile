import { create } from 'zustand';

interface UserState {
  pushToken: string | null;
  notificationsEnabled: boolean;
  setPushToken: (token: string | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  pushToken: null,
  notificationsEnabled: true,
  setPushToken: (token) => set({ pushToken: token }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
}));
