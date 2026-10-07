import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { generateApiKey, encrypt } from '../common/utils/crypto.js';
import { closeDb, db } from './client.js';
import { apiKeys, tenants, waAccounts } from './schema.js';

const run = async (): Promise<void> => {
  const tenantName = 'Default Tenant';

  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'default'))
    .limit(1);

  const tenant =
    existing ??
    (
      await db
        .insert(tenants)
        .values({ name: tenantName, slug: 'default' })
        .returning()
    )[0];

  if (env.META_ACCESS_TOKEN && env.META_PHONE_NUMBER_ID) {
    const [account] = await db
      .select()
      .from(waAccounts)
      .where(eq(waAccounts.phoneNumberId, env.META_PHONE_NUMBER_ID))
      .limit(1);

    if (!account) {
      await db.insert(waAccounts).values({
        tenantId: tenant.id,
        label: 'platform',
        accessTokenEncrypted: encrypt(env.META_ACCESS_TOKEN),
        phoneNumberId: env.META_PHONE_NUMBER_ID,
        wabaId: env.META_WABA_ID || null,
        isActive: true,
      });
      console.log(`Connected WhatsApp number (phone_number_id: ${env.META_PHONE_NUMBER_ID})`);
    } else {
      console.log('WhatsApp number already connected - skipping');
    }
  } else {
    console.log('META_ACCESS_TOKEN / META_PHONE_NUMBER_ID not set - skipping WhatsApp number');
  }

  const { key, hash, prefix } = generateApiKey();

  await db.insert(apiKeys).values({
    tenantId: tenant.id,
    label: 'seed',
    keyHash: hash,
    keyPrefix: prefix,
  });

  console.log('\n--------------------------------------------');
  console.log('Tenant:', tenant.name, `(${tenant.id})`);
  console.log('API key (shown once, stored hashed):');
  console.log('\n  ' + key + '\n');
  console.log('Use it:  curl -H "X-API-Key: ' + key + '" localhost:3000/api/v1/health');
  console.log('--------------------------------------------');
};

run()
  .catch((error) => {
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    console.error('Is Postgres running and migrated? Try: docker compose up -d && npm run db:push');
    process.exitCode = 1;
  })
  .finally(() => closeDb());
