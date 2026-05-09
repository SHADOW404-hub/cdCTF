import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/cyberplace";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using default: " + databaseUrl);
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";
