import { api } from '@/lib/api';
import type { LoginInput, SignupInput, SignupResponse } from '../types/auth';
import type { AuthSession } from '../types/auth';

export const authApi = {
  signup: (input: SignupInput) => api.post<SignupResponse>('/auth/signup', input),
  login: (input: LoginInput) => api.post<AuthSession>('/auth/login', input),
};