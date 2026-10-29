// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { unstable_cache, revalidateTag } from "next/cache";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "./db";

// Public pages read through `cdb`: the same Prisma calls, answered from the hosting data cache.
// Visitors then rarely touch the database, so a serverless database can sleep and stays within free limits.
// Any admin change clears the cache (see bustStore), so edits still appear immediately.
export const STORE_TAG = "store";
const TTL = 900;

const encode = (v: unknown) =>
  JSON.stringify(v, function (this: Record<string, unknown>, k, val) {
    const raw = this[k];
    if (raw instanceof Date) return { $t: raw.toISOString() };
    if (Prisma.Decimal.isDecimal(raw)) return { $d: (raw as Prisma.Decimal).toString() };
    if (typeof raw === "bigint") return { $b: raw.toString() };
    return val;
  });
const decode = <T>(s: string): T =>
  JSON.parse(s, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const keys = Object.keys(v);
      if (keys.length === 1) {
        if (keys[0] === "$t") return new Date(v.$t);
        if (keys[0] === "$d") return new Prisma.Decimal(v.$d);
        if (keys[0] === "$b") return BigInt(v.$b);
      }
    }
    return v;
  });

const READS = new Set(["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy"]);
type Model = "product" | "category" | "banner" | "offer" | "setting" | "rep" | "wholesaleCode";

const run = unstable_cache(
  async (model: string, op: string, args: string) => {
    const delegate = (db as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[model];
    return encode(await delegate[op](decode(args)));
  },
  ["cdb-v1"],
  { tags: [STORE_TAG], revalidate: TTL },
);

export const cdb = new Proxy({} as Pick<typeof db, Model>, {
  get: (_t, model: string) =>
    new Proxy(
      {},
      {
        get: (_m, op: string) => {
          if (!READS.has(op)) throw new Error(`cdb.${model}.${op} is not a cached read`);
          return async (args?: unknown) => decode(await run(model, op, encode(args ?? {})));
        },
      },
    ),
});

// Called on every admin API request: cleared right away and again once the response is sent (after the change is saved)
export function bustStore() {
  revalidateTag(STORE_TAG);
  try {
    after(() => revalidateTag(STORE_TAG));
  } catch {}
}
