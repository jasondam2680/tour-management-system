'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { api } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            user: User;
            accessToken: string;
            refreshToken: string;
          }>('/auth/login', { email, password });

          localStorage.setItem('access_token', data.accessToken);

          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      fetchProfile: async () => {
        try {
          const user = await api.get<User>('/auth/me');
          set({ user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
