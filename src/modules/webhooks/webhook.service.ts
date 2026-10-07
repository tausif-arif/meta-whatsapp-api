import { EventEmitter } from 'node:events';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { runWithContext, type WaAccountContext } from '../../common/context/requestContext.js';
import { metaClient } from '../../common/services/metaClient.js';
import { messageLogService } from '../../common/services/messageLog.service.js';
import { db } from '../../db/client.js';
import { tenants, waAccounts, type Tenant } from '../../db/schema.js';
import { ApiError } from '../../common/utils/ApiError.js';
import { decrypt } from '../../common/utils/crypto.js';
import { isValidSignature, parseWebhookPayload } from './webhook.utils.js';
import type {
  InboundMessage,
  ListWebhookMessagesQuery,
  ParsedWebhookEvents,
  WebhookVerifyQuery,
} from './webhook.types.js';

const MAX_STORED_MESSAGES = 500;
const MAX_SEEN_MESSAGE_IDS = 2000;

const storedMessages: InboundMessage[] = [];
const seenMessageIds = new Set<string>();

/**
 * Emits events consumers can subscribe to:
 *   webhookEvents.on('message', (msg) => ...)
 *   webhookEvents.on('status', (status) => ...)
 */
export const webhookEvents = new EventEmitter();

const resolveAccount = async (phoneNumberId: string) => {
  const [account] = await db
    .select()
    .from(waAccounts)
    .where(eq(waAccounts.phoneNumberId, phoneNumberId))
    .limit(1);

  if (!account) {
    logger.warn({ phoneNumberId }, 'Webhook received for unknown phone_number_id');
    return null;
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, account.tenantId)).limit(1);
  if (!tenant) return null;

  const waAccount: WaAccountContext = {
    id: account.id,
    accessToken: decrypt(account.accessTokenEncrypted),
    phoneNumberId: account.phoneNumberId,
    wabaId: account.wabaId,
  };

  return { tenant, waAccount };
};

const callAgent = async (tenant: Tenant, message: InboundMessage): Promise<string | null> => {
  if (!tenant.agentWebhookUrl) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AGENT_TIMEOUT_MS);

  try {
    const response = await fetch(tenant.agentWebhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(tenant.agentAuthToken ? { 'x-agent-token': tenant.agentAuthToken } : {}),
      },
      body: JSON.stringify({
        event: 'message.received',
        tenantId: tenant.id,
        messageId: message.id,
        from: message.from,
        profileName: message.contact?.profileName ?? null,
        type: message.type,
        text: message.text ?? null,
        payload: message.raw,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn(
        { tenantId: tenant.id, status: response.status, url: tenant.agentWebhookUrl },
        'Agent webhook returned non-2xx',
      );
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as Record<string, unknown>;
      const reply = data.reply ?? data.text ?? data.message;
      return typeof reply === 'string' && reply.trim() ? reply.trim() : null;
    }

    const text = (await response.text()).trim();
    return text || null;
  } catch (error) {
    logger.warn(
      { tenantId: tenant.id, error, url: tenant.agentWebhookUrl },
      'Agent webhook call failed',
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const sendAgentReply = async (
  tenant: Tenant,
  waAccount: WaAccountContext,
  message: InboundMessage,
  replyText: string,
): Promise<void> => {
  const context = { tenantId: tenant.id, waAccount };

  await runWithContext(context, async () => {
    try {
      const result = await metaClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: replyText },
      });

      await messageLogService.recordOutbound({
        source: 'agent',
        messageType: 'text',
        peer: message.from,
        metaMessageId: result.messages?.[0]?.id ?? null,
        payload: { replyTo: message.id, reply: replyText },
      });
    } catch (error) {
      logger.warn({ tenantId: tenant.id, error }, 'Failed to send agent reply to WhatsApp');
      await messageLogService.recordOutbound({
        source: 'agent',
        messageType: 'text',
        peer: message.from,
        status: 'failed',
        payload: { replyTo: message.id, reply: replyText },
        error: error instanceof Error ? error.message : 'send failed',
      });
    }
  });
};

const firstStatusError = (errors: unknown[]): string | null => {
  const first = errors[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    const record = first as Record<string, unknown>;
    return String(record.title ?? record.message ?? record.error_data ?? '') || null;
  }
  return null;
};

const dispatch = async (events: ParsedWebhookEvents): Promise<void> => {
  if (!events.phoneNumberId) return;

  try {
    const resolved = await resolveAccount(events.phoneNumberId);
    if (!resolved) return;

    const { tenant, waAccount } = resolved;

    for (const message of events.messages) {
      await messageLogService.recordInbound({
        tenantId: tenant.id,
        waAccountId: waAccount.id,
        messageType: message.type,
        peer: message.from,
        metaMessageId: message.id,
        payload: message,
      });

      if (seenMessageIds.has(message.id)) continue;
      seenMessageIds.add(message.id);
      if (seenMessageIds.size > MAX_SEEN_MESSAGE_IDS) {
        const oldest = seenMessageIds.values().next().value;
        if (oldest) seenMessageIds.delete(oldest);
      }

      if (!tenant.agentWebhookUrl) continue;

      const reply = await callAgent(tenant, message);
      if (reply) {
        await sendAgentReply(tenant, waAccount, message, reply);
      }
    }

    for (const status of events.statuses) {
      await messageLogService.updateStatus({
        tenantId: tenant.id,
        metaMessageId: status.id,
        status: status.status,
        error: status.status === 'failed' ? firstStatusError(status.errors) : null,
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to dispatch webhook events');
  }
};

export const webhookService = {
  verifyChallenge(query: WebhookVerifyQuery): string | null {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token && token === env.META_VERIFY_TOKEN && challenge) {
      return challenge;
    }
    return null;
  },

  processWebhook(
    rawBody: Buffer | string | undefined,
    signatureHeader: string | undefined,
    body: unknown,
  ): { received: boolean; messageCount: number; statusCount: number } {
    if (!isValidSignature(rawBody, signatureHeader, env.META_APP_SECRET)) {
      throw ApiError.unauthorized('Invalid webhook signature (X-Hub-Signature-256)');
    }

    const events = parseWebhookPayload(body);

    for (const message of events.messages) {
      storedMessages.push(message);
      if (storedMessages.length > MAX_STORED_MESSAGES) storedMessages.shift();
      webhookEvents.emit('message', message);
    }
    for (const status of events.statuses) {
      webhookEvents.emit('status', status);
    }

    void dispatch(events);

    return {
      received: true,
      messageCount: events.messages.length,
      statusCount: events.statuses.length,
    };
  },

  listMessages(query: ListWebhookMessagesQuery): {
    messages: InboundMessage[];
    total: number;
  } {
    let filtered = [...storedMessages].reverse();

    if (query.since) {
      const sinceTime = Date.parse(query.since);
      if (Number.isNaN(sinceTime)) {
        throw ApiError.badRequest('Query param "since" must be a valid ISO-8601 timestamp');
      }
      filtered = filtered.filter((message) => Date.parse(message.receivedAt) >= sinceTime);
    }

    const total = filtered.length;
    return { messages: filtered.slice(0, query.limit), total };
  },
};
