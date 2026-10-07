import { useAuthStore } from '@/stores/authStore';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type Query = Record<string, string | number | undefined>;

export const toQuery = (query?: Query): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : '';
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}${toQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: T;
    errors?: unknown;
  } | null;

  if (!response.ok) {
    if (response.status === 401 && auth) useAuthStore.getState().clear();
    throw new ApiError(
      json?.message ?? `Request failed (${response.status})`,
      response.status,
      json?.errors,
    );
  }

  return json?.data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { query }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};