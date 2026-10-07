export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  agentEnabled: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  tenant: AuthTenant;
}

export interface SignupResponse extends AuthSession {
  apiKey: string;
}

export interface SignupInput {
  name?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginInput {
  identity: string;
  password: string;
}