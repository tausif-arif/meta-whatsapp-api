import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/auth.api';
import type { AuthUser, AuthTenant } from '../types/auth';

interface Session {
  token: string;
  user: AuthUser;
  tenant: AuthTenant;
}

const applySession = (session: Session): void => {
  useAuthStore.getState().setSession(session.token, session.user, session.tenant);
};

export const useLogin = () =>
  useMutation({
    mutationFn: authApi.login,
    onSuccess: applySession,
  });

export const useSignup = () =>
  useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      const { token, user, tenant, apiKey } = data;
      useAuthStore.getState().setSession(token, user, tenant);
      return { apiKey };
    },
  });