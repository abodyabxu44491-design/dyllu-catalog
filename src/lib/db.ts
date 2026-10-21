// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { PrismaClient } from "@prisma/client";

// Serverless databases (e.g. Neon) sleep when idle and need a few seconds to wake up.
// Give the first connection enough time instead of failing after the 5s default.
function withTimeouts(raw?: string) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "20");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return raw;
  }
}

const READS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
]);
const TRANSIENT =
  /P1001|P1002|P1008|P1017|P2024|Can't reach database|Timed out fetching a new connection|Server has closed the connection|Connection terminated|ECONNRESET/i;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function create() {
  const base = new PrismaClient({ datasourceUrl: withTimeouts(process.env.DATABASE_URL) });
  // Reads are retried on connection hiccups (database waking up, dropped connection).
  // Writes are never retried, so an order can't be saved twice.
  return base.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            const msg = `${(e as { code?: string }).code ?? ""} ${(e as Error).message ?? ""}`;
            if (attempt >= 2 || !READS.has(operation) || !TRANSIENT.test(msg)) throw e;
            await wait(600 * (attempt + 1));
          }
        }
      },
    },
  });
}

const g = globalThis as unknown as { prisma?: ReturnType<typeof create> };
export const db = g.prisma ?? create();
g.prisma = db;
