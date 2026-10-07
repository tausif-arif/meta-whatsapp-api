import { AsyncLocalStorage } from 'node:async_hooks';
import { ApiError } from '../utils/ApiError.js';

export interface WaAccountContext {
  id: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string | null;
}

export interface RequestContext {
  tenantId: string;
  apiKeyId?: string;
  waAccount?: WaAccountContext | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(context: RequestContext, fn: () => T): T =>
  storage.run(context, fn);

export const getRequestContext = (): RequestContext | undefined => storage.getStore();

export const requireTenantId = (): string => {
  const context = storage.getStore();
  if (!context) {
    throw ApiError.unauthorized('Request context is missing');
  }
  return context.tenantId;
};

export const requireWaAccount = (): WaAccountContext => {
  const context = storage.getStore();
  if (!context?.waAccount) {
    throw ApiError.unavailable(
      'No WhatsApp number connected. Seed the platform number (npm run db:seed) or connect one for this tenant.',
    );
  }
  return context.waAccount;
};
