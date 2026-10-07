import { randomBytes } from 'node:crypto';

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizePhone = (phone: string): string => phone.trim().replace(/[\s()\-]/g, '');

export const identityIsEmail = (identity: string): boolean => identity.includes('@');

export const buildTenantName = (seed: string, fallback = 'My Company'): string => {
  const name = seed.trim().slice(0, 50);
  return name || fallback;
};

export const buildTenantSlug = (seed: string): string => {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `${base || 'tenant'}-${randomBytes(3).toString('hex')}`;
};