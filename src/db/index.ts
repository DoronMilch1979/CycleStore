import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";
import type { AppDatabase } from "./types";

const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
  drizzleDb?: AppDatabase;
};

function resolveDatabaseUrl() {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const nextPhase = process.env.NEXT_PHASE;
  if (nextPhase === "phase-production-build" || nextPhase === "phase-development-build") {
    return "postgres://127.0.0.1:1/build-placeholder";
  }

  throw new Error("DATABASE_URL is not configured");
}

function createClient() {
  const databaseUrl = resolveDatabaseUrl();
  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("build-placeholder");

  const pooled = databaseUrl.includes("-pooler");

  return postgres(databaseUrl, {
    max: env.NODE_ENV === "production" ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: isLocal ? false : "require",
    // Transaction-mode poolers reject prepared statements. Local Postgres keeps them.
    prepare: pooled ? false : true,
  });
}

export function getDb(): AppDatabase {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const client = globalForDb.postgresClient ?? createClient();
  const db = drizzle(client, { schema }) as AppDatabase;

  // One client per server instance, including production. A fresh pool on every
  // call opens new TCP connections to Neon and is what makes Vercel feel slow.
  globalForDb.postgresClient = client;
  globalForDb.drizzleDb = db;

  return db;
}
