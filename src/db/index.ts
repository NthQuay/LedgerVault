import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const rawSql = neon(process.env.DATABASE_URL);

// Neon's free-tier compute suspends after ~5 minutes idle. The query that
// wakes it back up occasionally fails outright instead of just being slow,
// so one retry smooths over that cold-start hiccup for every query drizzle
// makes (drizzle-orm/neon-http always calls `sql.query`, never the tagged
// template form, so wrapping that one method covers everything).
// drizzle-orm/neon-http only ever calls `.then()`/`await`s the result, so a
// plain Promise satisfies every real usage even though it doesn't carry the
// extra `execute`/`queryData` members of Neon's own NeonQueryPromise type.
rawSql.query = ((
  (originalQuery) =>
    async (...args: Parameters<typeof originalQuery>) => {
      try {
        return await originalQuery(...args);
      } catch {
        return await originalQuery(...args);
      }
    }
)(rawSql.query.bind(rawSql))) as unknown as typeof rawSql.query;

export const db = drizzle(rawSql, { schema });
