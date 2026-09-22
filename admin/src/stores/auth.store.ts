import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { setAuthToken } from '../services/api.client';
import { fetchMe, loginRequest } from '../services/auth.service';
import { isAppAdmin, type User } from '../types';

const TOKEN_KEY = 'bm_admin_auth_token';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function persistSession(token: string, user: User) {
  if (!isAppAdmin(user.role)) {
    throw new Error('Only app admins can sign in to Barighorr Admin');
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  setAuthToken(token);
  return { token, user, isAuthenticated: true, isLoading: false };
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isHydrated: true, isAuthenticated: false });
        return;
      }

      setAuthToken(token);
      const user = await fetchMe();
      if (!isAppAdmin(user.role)) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isHydrated: true,
        });
        return;
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isHydrated: true,
      });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  login: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const { token, user } = await loginRequest(identifier, password);
      set(await persistSession(token, user));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
