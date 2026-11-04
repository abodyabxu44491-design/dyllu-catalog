// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";

// Cloudflare D1 is reached through the Worker binding `DB`; one client is kept per binding.
type Holder = { binding?: unknown; client?: PrismaClient };
const LIMIT = /parameter limit|too many SQL variables/i;
// Reads with long id lists are split by Prisma, but count() is not: fall back to counting the matching ids
function withSafeCount(base: PrismaClient): PrismaClient {
  return base.$extends({
    query: {
      $allModels: {
        async count({ model, args, query }) {
          try {
            return await query(args);
          } catch (e) {
            if (!LIMIT.test(String((e as Error)?.message)) || (args as { select?: unknown }).select) throw e;
            const key = model.charAt(0).toLowerCase() + model.slice(1);
            const delegate = (base as unknown as Record<string, { findMany(a: unknown): Promise<unknown[]> }>)[key];
            return (await delegate.findMany({ where: (args as { where?: unknown }).where, select: { id: true } })).length;
          }
        },
      },
    },
  }) as unknown as PrismaClient;
}
const g = globalThis as unknown as { __dyllu_db?: Holder };
function client(): PrismaClient {
  const binding = getCloudflareContext().env.DB;
  const h = (g.__dyllu_db ??= {});
  if (!h.client || h.binding !== binding) {
    h.binding = binding;
    h.client = withSafeCount(new PrismaClient({ adapter: new PrismaD1(binding) }));
  }
  return h.client;
}
export const db = new Proxy({} as PrismaClient, {
  get(_t, key) {
    const c = client() as unknown as Record<PropertyKey, unknown>;
    const v = c[key];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
});
