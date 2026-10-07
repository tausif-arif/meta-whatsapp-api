import { and, count, eq, isNull, or, type SQL } from 'drizzle-orm';
import { ApiError } from '../../common/utils/ApiError.js';
import { generateApiKey } from '../../common/utils/crypto.js';
import { signClientToken } from '../../common/utils/jwt.js';
import { hashPassword, verifyPassword } from '../../common/utils/password.js';
import { db } from '../../db/client.js';
import { apiKeys, clientUsers, tenants, waAccounts } from '../../db/schema.js';
import {
  buildTenantName,
  buildTenantSlug,
  identityIsEmail,
  normalizeEmail,
  normalizePhone,
} from './client.utils.js';
import type { LoginInput, SignupInput } from './client.types.js';

const safeUser = (user: typeof clientUsers.$inferSelect) => ({
  id: user.id,
  email: user.email ?? null,
  phone: user.phone ?? null,
  createdAt: user.createdAt,
});

const safeTenant = (tenant: typeof tenants.$inferSelect) => ({
  id: tenant.id,
  name: tenant.name,
  slug: tenant.slug,
  plan: tenant.plan,
  agentEnabled: Boolean(tenant.agentWebhookUrl),
});

export const authService = {
  async signup(input: SignupInput) {
    const email = input.email ? normalizeEmail(input.email) : null;
    const phone = input.phone ? normalizePhone(input.phone) : null;

    const identityConditions: SQL[] = [];
    if (email) identityConditions.push(eq(clientUsers.email, email));
    if (phone) identityConditions.push(eq(clientUsers.phone, phone));

    if (identityConditions.length > 0) {
      const [existing] = await db
        .select({ id: clientUsers.id })
        .from(clientUsers)
        .where(or(...identityConditions))
        .limit(1);
      if (existing) throw ApiError.conflict('An account with this email or phone already exists');
    }

    const seed = email || phone || 'tenant';
    const { key, hash, prefix } = generateApiKey();

    const created = await db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: buildTenantName(input.name ?? seed), slug: buildTenantSlug(seed) })
        .returning();

      const [user] = await tx
        .insert(clientUsers)
        .values({ tenantId: tenant.id, email, phone, passwordHash: hashPassword(input.password) })
        .returning();

      await tx.insert(apiKeys).values({
        tenantId: tenant.id,
        label: 'default',
        keyHash: hash,
        keyPrefix: prefix,
      });

      return { tenant, user };
    });

    const token = signClientToken({ sub: created.user.id, tenantId: created.tenant.id });

    return { token, apiKey: key, user: safeUser(created.user), tenant: safeTenant(created.tenant) };
  },

  async login(input: LoginInput) {
    const identity = identityIsEmail(input.identity)
      ? normalizeEmail(input.identity)
      : normalizePhone(input.identity);

    const [user] = await db
      .select()
      .from(clientUsers)
      .where(or(eq(clientUsers.email, identity), eq(clientUsers.phone, identity)))
      .limit(1);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);
    if (!tenant) throw ApiError.notFound('Tenant not found');

    const token = signClientToken({ sub: user.id, tenantId: tenant.id });
    return { token, user: safeUser(user), tenant: safeTenant(tenant) };
  },

  async me(tenantId: string, userId: string) {
    const [user] = await db
      .select()
      .from(clientUsers)
      .where(and(eq(clientUsers.id, userId), eq(clientUsers.tenantId, tenantId)))
      .limit(1);
    if (!user) throw ApiError.unauthorized('Session no longer valid');

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) throw ApiError.notFound('Tenant not found');

    const [keyCount] = await db
      .select({ n: count() })
      .from(apiKeys)
      .where(and(eq(apiKeys.tenantId, tenantId), isNull(apiKeys.revokedAt)));
    const [accountCount] = await db
      .select({ n: count() })
      .from(waAccounts)
      .where(and(eq(waAccounts.tenantId, tenantId)));

    return {
      user: safeUser(user),
      tenant: safeTenant(tenant),
      counts: { apiKeys: keyCount.n, waAccounts: accountCount.n },
    };
  },
};