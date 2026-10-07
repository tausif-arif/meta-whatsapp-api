import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  agentEnabled: boolean;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  tenant: SessionTenant | null;
  setSession: (token: string, user: SessionUser, tenant: SessionTenant) => void;
  setProfile: (user: SessionUser, tenant: SessionTenant) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      setSession: (token, user, tenant) => set({ token, user, tenant }),
      setProfile: (user, tenant) => set({ user, tenant }),
      clear: () => set({ token: null, user: null, tenant: null }),
    }),
    { name: 'mwa-dashboard' },
  ),
);