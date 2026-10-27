import { Pool } from "pg";

// Singleton Pool, reused across hot-reloads in dev.
const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  globalForDb.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("sslmode=verify-full")
      ? { rejectUnauthorized: true }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pgPool = pool;

// Small typed helper for one-row / many-row queries.
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
