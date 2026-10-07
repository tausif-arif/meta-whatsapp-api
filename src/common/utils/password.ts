import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCHEME = 'scrypt';

export const hashPassword = (password: string): string => {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = scryptSync(password, salt, KEY_BYTES).toString('hex');
  return `${SCHEME}$${salt}$${hash}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== SCHEME || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, KEY_BYTES);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};