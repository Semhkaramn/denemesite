import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Fix Heroku DATABASE_URL (postgres:// -> postgresql://)
    const fixedUrl = DATABASE_URL.startsWith("postgres://")
      ? DATABASE_URL.replace("postgres://", "postgresql://")
      : DATABASE_URL;

    pool = new Pool({
      connectionString: fixedUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
