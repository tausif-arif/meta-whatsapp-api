import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  agentWebhookUrl: text('agent_webhook_url'),
  agentAuthToken: text('agent_auth_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('default'),
    keyHash: text('key_hash').notNull().unique(),
    keyPrefix: text('key_prefix').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('api_keys_tenant_idx').on(table.tenantId)],
);

export const waAccounts = pgTable(
  'wa_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('default'),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    phoneNumberId: text('phone_number_id').notNull(),
    wabaId: text('waba_id'),
    phoneNumber: text('phone_number'),
    displayName: text('display_name'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('wa_accounts_phone_number_id_idx').on(table.phoneNumberId),
    index('wa_accounts_tenant_idx').on(table.tenantId),
  ],
);

export const messageLogs = pgTable(
  'message_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
    waAccountId: uuid('wa_account_id').references(() => waAccounts.id, { onDelete: 'set null' }),
    direction: text('direction').$type<'inbound' | 'outbound'>().notNull(),
    source: text('source').$type<'api' | 'agent' | 'webhook'>().notNull(),
    messageType: text('message_type').notNull(),
    peer: text('peer').notNull(),
    metaMessageId: text('meta_message_id'),
    status: text('status').notNull(),
    error: text('error'),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('message_logs_tenant_created_idx').on(table.tenantId, table.createdAt),
    index('message_logs_meta_id_idx').on(table.metaMessageId),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type WaAccount = typeof waAccounts.$inferSelect;
export type MessageLog = typeof messageLogs.$inferSelect;
