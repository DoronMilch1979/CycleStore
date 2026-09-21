import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/env";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const payload: {
    status: "ok" | "degraded";
    database: "up" | "down" | "not_configured";
    time: string;
  } = {
    status: "ok",
    database: "not_configured",
    time: new Date().toISOString(),
  };

  if (!isDatabaseConfigured()) {
    payload.status = "degraded";
    return NextResponse.json(payload);
  }

  try {
    await getDb().execute(sql`select 1`);
    payload.database = "up";
  } catch {
    payload.status = "degraded";
    payload.database = "down";
    return NextResponse.json(payload, { status: 503 });
  }

  return NextResponse.json(payload);
}
