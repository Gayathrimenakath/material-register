import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

export const pool = new Pool({ connectionString });

// Without a listener, an error on an idle connection (for example when
// Postgres restarts) would crash the whole process.
pool.on("error", (error) => {
  console.error("Unexpected database error:", error);
});

export const db = drizzle(pool, { schema });
