import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

export const pingDb = async (): Promise<boolean> => {
  try {
    await pool.query('select 1');
    return true;
  } catch {
    return false;
  }
};

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
