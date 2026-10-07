import { and, eq } from 'drizzle-orm';
import { logger } from '../../config/logger.js';
import { db } from '../../db/client.js';
import { messageLogs } from '../../db/schema.js';
import { getRequestContext } from '../context/requestContext.js';

const failSafe = async (label: string, fn: () => Promise<unknown>): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    logger.warn({ error, label }, 'message_logs write failed');
  }
};

export const messageLogService = {
  recordOutbound(options: {
    source: 'api' | 'agent';
    messageType: string;
    peer: string;
    metaMessageId?: string | null;
    status?: string;
    payload?: unknown;
    error?: string | null;
  }): Promise<void> {
    const context = getRequestContext();
    if (!context) return Promise.resolve();

    return failSafe('recordOutbound', async () => {
      await db.insert(messageLogs).values({
        tenantId: context.tenantId,
        apiKeyId: context.apiKeyId ?? null,
        waAccountId: context.waAccount?.id ?? null,
        direction: 'outbound',
        source: options.source,
        messageType: options.messageType,
        peer: options.peer,
        metaMessageId: options.metaMessageId ?? null,
        status: options.status ?? (options.metaMessageId ? 'sent' : 'failed'),
        error: options.error ?? null,
        payload: options.payload === undefined ? null : options.payload,
      });
    });
  },

  recordInbound(options: {
    tenantId: string;
    waAccountId: string;
    messageType: string;
    peer: string;
    metaMessageId: string | null;
    payload?: unknown;
  }): Promise<void> {
    return failSafe('recordInbound', async () => {
      await db.insert(messageLogs).values({
        tenantId: options.tenantId,
        waAccountId: options.waAccountId,
        direction: 'inbound',
        source: 'webhook',
        messageType: options.messageType,
        peer: options.peer,
        metaMessageId: options.metaMessageId,
        status: 'received',
        payload: options.payload === undefined ? null : options.payload,
      });
    });
  },

  updateStatus(options: {
    tenantId: string;
    metaMessageId: string;
    status: string;
    error?: string | null;
  }): Promise<void> {
    return failSafe('updateStatus', async () => {
      await db
        .update(messageLogs)
        .set({
          status: options.status,
          error: options.error ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(messageLogs.metaMessageId, options.metaMessageId),
            eq(messageLogs.tenantId, options.tenantId),
          ),
        );
    });
  },
};
