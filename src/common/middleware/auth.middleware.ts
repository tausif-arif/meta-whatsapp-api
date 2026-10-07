import type { RequestHandler } from 'express';
import { and, eq } from 'drizzle-orm';
import { runWithContext, type WaAccountContext } from '../context/requestContext.js';
import { db } from '../../db/client.js';
import { apiKeys, waAccounts } from '../../db/schema.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { decrypt, hashApiKey } from '../utils/crypto.js';
import { verifyClientToken } from '../utils/jwt.js';

const CACHE_TTL_MS = 60_000;

interface KeyEntry {
  tenantId: string;
  apiKeyId: string;
  revoked: boolean;
  waAccount: WaAccountContext | null;
  expiresAt: number;
}

const cache = new Map<string, KeyEntry>();

const loadKeyEntry = async (hash: string): Promise<KeyEntry | null> => {
  const [record] = await db
    .select({
      id: apiKeys.id,
      tenantId: apiKeys.tenantId,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (!record) return null;

  let waAccount: WaAccountContext | null = null;

  if (!record.revokedAt) {
    const [account] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.tenantId, record.tenantId), eq(waAccounts.isActive, true)))
      .orderBy(waAccounts.createdAt)
      .limit(1);

    if (account) {
      try {
        waAccount = {
          id: account.id,
          accessToken: decrypt(account.accessTokenEncrypted),
          phoneNumberId: account.phoneNumberId,
          wabaId: account.wabaId,
        };
      } catch (error) {
        cache.delete(hash);
        logger.error({ error, tenantId: record.tenantId }, 'Failed to decrypt stored Meta token');
        throw ApiError.internal('Stored WhatsApp credentials could not be decrypted (check ENCRYPTION_KEY)');
      }
    }
  }

  return {
    tenantId: record.tenantId,
    apiKeyId: record.id,
    revoked: Boolean(record.revokedAt),
    waAccount,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
};

const lookupKey = async (key: string): Promise<KeyEntry | null> => {
  const hash = hashApiKey(key);
  const cached = cache.get(hash);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const entry = await loadKeyEntry(hash);
  if (entry) cache.set(hash, entry);
  return entry;
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('x-api-key') ?? req.header('authorization');
    if (!header) {
      throw ApiError.unauthorized('Missing API key. Pass it in the X-API-Key header.');
    }

    const token = header.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : header.trim();

    const entry = await lookupKey(token);
    if (!entry || entry.revoked) {
      throw ApiError.unauthorized('Invalid API key');
    }

    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, entry.apiKeyId))
      .then(undefined, () => undefined);

    req.apiKey = token;

    runWithContext(
      { tenantId: entry.tenantId, apiKeyId: entry.apiKeyId, waAccount: entry.waAccount },
      () => next(),
    );
  } catch (error) {
    next(error);
  }
};

export const requireClient: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('authorization');
    if (!header?.toLowerCase().startsWith('bearer ')) {
      throw ApiError.unauthorized('Missing bearer token. Sign in via POST /api/v1/auth/login');
    }

    const { sub, tenantId } = verifyClientToken(header.slice(7).trim());
    req.clientUserId = sub;
    req.tenantId = tenantId;

    runWithContext({ tenantId, clientUserId: sub }, () => next());
  } catch (error) {
    next(error);
  }
};
