import { and, asc, count, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { ApiError } from '../../common/utils/ApiError.js';
import { generateApiKey } from '../../common/utils/crypto.js';
import { db } from '../../db/client.js';
import { apiKeys, messageLogs, waAccounts } from '../../db/schema.js';
import type {
  AnalyticsSummaryQuery,
  MessagesQuery,
  TimeseriesQuery,
} from './client.types.js';

const scope = (tenantId: string, from?: string, to?: string): SQL[] => {
  const conditions: SQL[] = [eq(messageLogs.tenantId, tenantId)];
  if (from) conditions.push(gte(messageLogs.createdAt, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    conditions.push(lte(messageLogs.createdAt, end));
  }
  return conditions;
};

const pct = (part: number, total: number): number => (total <= 0 ? 0 : Math.round((part / total) * 100));

export const clientService = {
  async listApiKeys(tenantId: string) {
    return db
      .select({
        id: apiKeys.id,
        label: apiKeys.label,
        keyPrefix: apiKeys.keyPrefix,
        revokedAt: apiKeys.revokedAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));
  },

  async createApiKey(tenantId: string, label: string) {
    const { key, hash, prefix } = generateApiKey();
    const [row] = await db
      .insert(apiKeys)
      .values({ tenantId, label, keyHash: hash, keyPrefix: prefix })
      .returning({ id: apiKeys.id, label: apiKeys.label, keyPrefix: apiKeys.keyPrefix, createdAt: apiKeys.createdAt });
    return { ...row, apiKey: key };
  },

  async revokeApiKey(tenantId: string, id: string) {
    const [row] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)))
      .returning({ id: apiKeys.id, revokedAt: apiKeys.revokedAt });
    if (!row) throw ApiError.notFound('API key not found');
    return row;
  },

  async listWaAccounts(tenantId: string) {
    return db
      .select({
        id: waAccounts.id,
        phoneNumberId: waAccounts.phoneNumberId,
        phoneNumber: waAccounts.phoneNumber,
        displayName: waAccounts.displayName,
        isActive: waAccounts.isActive,
        createdAt: waAccounts.createdAt,
      })
      .from(waAccounts)
      .where(eq(waAccounts.tenantId, tenantId))
      .orderBy(desc(waAccounts.createdAt));
  },

  connectWhatsappLink() {
    if (!env.META_APP_ID) {
      return {
        status: 'not_configured',
        message: 'WhatsApp connection is not enabled yet. Set META_APP_ID / META_APP_SECRET to enable it.',
      };
    }
    return {
      status: 'ready',
      appId: env.META_APP_ID,
      url: `https://www.facebook.com/ab_whatsappbusinessapp/businessseed/?app_id=${env.META_APP_ID}`,
    };
  },

  async analyticsSummary(tenantId: string, query: AnalyticsSummaryQuery) {
    const conditions = scope(tenantId, query.from, query.to);

    const [outbound] = await db
      .select({ n: count() })
      .from(messageLogs)
      .where(and(...conditions, eq(messageLogs.direction, 'outbound')));
    const [inbound] = await db
      .select({ n: count() })
      .from(messageLogs)
      .where(and(...conditions, eq(messageLogs.direction, 'inbound')));

    const [byStatus, byType, byChannel] = await Promise.all([
      db
        .select({ key: messageLogs.status, value: count() })
        .from(messageLogs)
        .where(and(...conditions, eq(messageLogs.direction, 'outbound')))
        .groupBy(messageLogs.status),
      db
        .select({ key: messageLogs.messageType, value: count() })
        .from(messageLogs)
        .where(and(...conditions))
        .groupBy(messageLogs.messageType),
      db
        .select({ key: messageLogs.source, value: count() })
        .from(messageLogs)
        .where(and(...conditions))
        .groupBy(messageLogs.source),
    ]);

    const toMap = (rows: { key: string; value: number }[]): Record<string, number> =>
      Object.fromEntries(rows.map((row) => [row.key, row.value]));

    const statusMap = toMap(byStatus);
    const deliveredRead = (statusMap.sent ?? 0) + (statusMap.delivered ?? 0) + (statusMap.read ?? 0);

    return {
      period: { from: query.from ?? null, to: query.to ?? null },
      totals: { outbound: outbound.n, inbound: inbound.n, total: outbound.n + inbound.n },
      byType: toMap(byType),
      byChannel: toMap(byChannel),
      byStatus: statusMap,
      rates: {
        deliveredRate: pct(deliveredRead, outbound.n),
        readRate: pct(statusMap.read ?? 0, outbound.n),
        failedRate: pct(statusMap.failed ?? 0, outbound.n),
      },
    };
  },

  async analyticsTimeseries(tenantId: string, query: TimeseriesQuery) {
    const bucket =
      query.granularity === 'hour'
        ? sql<Date>`date_trunc('hour', created_at)`
        : sql<Date>`date_trunc('day', created_at)`;

    const rows = await db
      .select({ bucket, direction: messageLogs.direction, value: count() })
      .from(messageLogs)
      .where(and(...scope(tenantId, query.from, query.to)))
      .groupBy(bucket, messageLogs.direction)
      .orderBy(asc(bucket));

    return rows.map((row) => ({
      bucket: new Date(row.bucket).toISOString(),
      direction: row.direction,
      value: row.value,
    }));
  },

  async analyticsTopContacts(tenantId: string, limit: number, from?: string, to?: string) {
    const rows = await db
      .select({ peer: messageLogs.peer, value: count() })
      .from(messageLogs)
      .where(and(...scope(tenantId, from, to)))
      .groupBy(messageLogs.peer)
      .orderBy(desc(count()))
      .limit(limit);
    return rows;
  },

  async listMessages(tenantId: string, query: MessagesQuery) {
    const base: SQL[] = [eq(messageLogs.tenantId, tenantId)];
    if (query.direction) base.push(eq(messageLogs.direction, query.direction));
    if (query.type) base.push(eq(messageLogs.messageType, query.type));
    if (query.status) base.push(eq(messageLogs.status, query.status));

    const [total] = await db
      .select({ n: count() })
      .from(messageLogs)
      .where(and(...base));

    const messages = await db
      .select({
        id: messageLogs.id,
        direction: messageLogs.direction,
        source: messageLogs.source,
        messageType: messageLogs.messageType,
        peer: messageLogs.peer,
        metaMessageId: messageLogs.metaMessageId,
        status: messageLogs.status,
        error: messageLogs.error,
        createdAt: messageLogs.createdAt,
        updatedAt: messageLogs.updatedAt,
      })
      .from(messageLogs)
      .where(and(...base))
      .orderBy(desc(messageLogs.createdAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    return {
      messages,
      page: query.page,
      limit: query.limit,
      total: total.n,
      totalPages: Math.max(1, Math.ceil(total.n / query.limit)),
    };
  },
};