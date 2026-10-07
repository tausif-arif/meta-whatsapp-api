import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ParsedWebhookEvents, InboundMessage, InboundStatus } from './webhook.types.js';

export const isValidSignature = (
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean => {
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  if (rawBody === undefined) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const parseMessage = (
  raw: Record<string, unknown>,
  contact: InboundMessage['contact'],
): InboundMessage => {
  const text = asRecord(raw.text);
  const button = asRecord(raw.button);

  return {
    id: String(raw.id ?? ''),
    from: String(raw.from ?? ''),
    timestamp: String(raw.timestamp ?? ''),
    type: String(raw.type ?? 'unknown'),
    text: typeof text.body === 'string' ? text.body : undefined,
    payload: typeof button.payload === 'string' ? button.payload : undefined,
    interactive:
      typeof raw.interactive === 'object' && raw.interactive !== null
        ? (raw.interactive as Record<string, unknown>)
        : undefined,
    contact,
    raw,
    receivedAt: new Date().toISOString(),
  };
};

const parseStatus = (raw: Record<string, unknown>): InboundStatus => ({
  id: String(raw.id ?? ''),
  status: String(raw.status ?? ''),
  timestamp: String(raw.timestamp ?? ''),
  recipientId: typeof raw.recipient_id === 'string' ? raw.recipient_id : null,
  errors: Array.isArray(raw.errors) ? raw.errors : [],
});

export const parseWebhookPayload = (body: unknown): ParsedWebhookEvents => {
  const events: ParsedWebhookEvents = { phoneNumberId: null, messages: [], statuses: [] };
  const root = asRecord(body);

  if (!Array.isArray(root.entry)) return events;

  for (const entry of root.entry) {
    const changes = asRecord(entry).changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const changeRecord = asRecord(change);
      if (changeRecord.field !== 'messages') continue;

      const value = asRecord(changeRecord.value);
      const metadata = asRecord(value.metadata);
      if (!events.phoneNumberId && typeof metadata.phone_number_id === 'string') {
        events.phoneNumberId = metadata.phone_number_id;
      }
      events.messages.push(...parseMessages(value));

      if (Array.isArray(value.statuses)) {
        events.statuses.push(
          ...value.statuses.map((status) => parseStatus(asRecord(status))),
        );
      }
    }
  }

  return events;
};

const parseMessages = (value: Record<string, unknown>): InboundMessage[] => {
  if (!Array.isArray(value.messages)) return [];

  const contacts = new Map<string, string | null>();
  if (Array.isArray(value.contacts)) {
    for (const contact of value.contacts) {
      const record = asRecord(contact);
      const profile = asRecord(record.profile);
      contacts.set(String(record.wa_id ?? ''), typeof profile.name === 'string' ? profile.name : null);
    }
  }

  return value.messages.map((message) => {
    const raw = asRecord(message);
    const from = String(raw.from ?? '');
    return parseMessage(raw, {
      waId: from,
      profileName: contacts.get(from) ?? null,
    });
  });
};
