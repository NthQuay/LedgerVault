import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

declare global {
  var __ledgervaultPool: Pool | undefined;
}

const pool =
  globalThis.__ledgervaultPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ledgervaultPool = pool;
}

export const db = drizzle(pool, { schema });
