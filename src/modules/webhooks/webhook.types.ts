import { z } from 'zod';

export const webhookVerifyQuerySchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional(),
});

export const listWebhookMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  since: z.string().optional(),
});

export type WebhookVerifyQuery = z.infer<typeof webhookVerifyQuerySchema>;
export type ListWebhookMessagesQuery = z.infer<typeof listWebhookMessagesQuerySchema>;

export interface InboundContact {
  waId: string;
  profileName: string | null;
}

export interface InboundMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: string;
  payload?: string;
  interactive?: Record<string, unknown>;
  contact: InboundContact | null;
  raw: Record<string, unknown>;
  receivedAt: string;
}

export interface InboundStatus {
  id: string;
  status: string;
  timestamp: string;
  recipientId: string | null;
  errors: unknown[];
}

export interface ParsedWebhookEvents {
  phoneNumberId: string | null;
  messages: InboundMessage[];
  statuses: InboundStatus[];
}
