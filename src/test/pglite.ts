import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "@/db/schema";
import type { AppDatabase } from "@/db/types";

let cachedStatements: string[] | null = null;

async function schemaSql() {
  if (cachedStatements) {
    return cachedStatements;
  }

  const previous = generateDrizzleJson({});
  const current = generateDrizzleJson(schema, previous.id);
  const statements = await generateMigration(previous, current);
  cachedStatements = statements;
  return statements;
}

export async function createTestDatabase(): Promise<{
  db: AppDatabase;
  close: () => Promise<void>;
}> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as AppDatabase;
  const statements = await schemaSql();
  for (const statement of statements) {
    await client.exec(statement);
  }
  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}
