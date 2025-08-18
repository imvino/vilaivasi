//lib/db.ts
import { Pool } from 'pg';

// Create a single database pool to be reused across requests
let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  
  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const client = await getDb().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getDb().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}