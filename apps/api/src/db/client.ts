import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (dbInstance) {
    return dbInstance;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  dbInstance = drizzle(pool);
  return dbInstance;
};
