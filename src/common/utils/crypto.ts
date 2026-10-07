import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from './ApiError.js';

const ALGORITHM = 'aes-256-gcm';

const getKey = (): Buffer => {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw ApiError.internal('ENCRYPTION_KEY must be base64 of exactly 32 bytes. Run: npm run keygen');
  }
  return key;
};

export const encrypt = (plaintext: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
};

export const decrypt = (payload: string): string => {
  const [iv, tag, data] = payload.split('.');
  if (!iv || !tag || !data) {
    throw ApiError.internal('Malformed encrypted value in database');
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

export const hashApiKey = (key: string): string =>
  createHash('sha256').update(key).digest('hex');

export const generateApiKey = (): { key: string; hash: string; prefix: string } => {
  const key = `mwa_live_${randomBytes(24).toString('base64url')}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 12) };
};
