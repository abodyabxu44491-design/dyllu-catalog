// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";

// Cloudflare D1 is reached through the Worker binding `DB`; one client is kept per binding.
type Holder = { binding?: unknown; client?: PrismaClient };
const LIMIT = /parameter limit|too many SQL variables/i;
type Row = Record<string, unknown> & { id: number };
type Args = Record<string, unknown> & { where?: Record<string, unknown>; select?: Record<string, unknown>; skip?: number; take?: number };
type Delegate = { findMany(a: unknown): Promise<Row[]> };
const PART = 80; // values per query part, under D1's 100 bound values with room for the other filters
const isLimit = (e: unknown) => LIMIT.test(String((e as Error)?.message));

// Sort merged parts like the database would for plain field orderings ({ field: "asc" | "desc" } or a list of them)
const sortKey = (v: unknown) =>
  v instanceof Date ? v.getTime() : v && typeof v === "object" && "toNumber" in v ? (v as { toNumber(): number }).toNumber() : v;
function sortRows(rows: Row[], orderBy: unknown) {
  const keys = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []).flatMap((o) => Object.entries(o as object));
  if (!keys.length || keys.some(([, dir]) => dir !== "asc" && dir !== "desc")) return rows;
  return rows.sort((x, y) => {
    for (const [k, dir] of keys) {
      const a = sortKey(x[k]),
        b = sortKey(y[k]);
      if (a === b) continue;
      const c = a == null ? -1 : b == null ? 1 : (a as number) < (b as number) ? -1 : 1; // SQLite puts NULL first
      return dir === "asc" ? c : -c;
    }
    return 0;
  });
}

// D1 accepts at most 100 bound values per query. Prisma does not split every case for it:
//  - a long `in` list combined with ordering, or count() with one
//  - a nested include (e.g. orders with their items) loaded for more than ~98 parents
// When D1 refuses, the same read is repeated in parts and merged, giving the same rows in the same order.
async function safeFindMany(d: Delegate, a: Args): Promise<Row[]> {
  const w = a.where ?? {};
  const key = Object.keys(w).find((k) => {
    const v = w[k] as { in?: unknown };
    return v && typeof v === "object" && Array.isArray(v.in) && v.in.length > PART;
  });
  if (key) {
    const list = [...new Set((w[key] as { in: unknown[] }).in)];
    const rows: Row[] = [];
    for (let i = 0; i < list.length; i += PART) {
      const part = {
        ...a,
        where: { ...w, [key]: { ...(w[key] as object), in: list.slice(i, i + PART) } },
        skip: undefined,
        take: undefined,
      };
      rows.push(...(await readPart(d, part)));
    }
    const from = a.skip ?? 0;
    return sortRows(rows, a.orderBy).slice(from, a.take != null ? from + a.take : undefined);
  }
  if (a.cursor || a.distinct) throw new Error("D1 parameter limit: cannot split a cursor/distinct read");
  // Nested include over many parents: find the matching ids in order, then load them with their relations in groups
  const ids = (await d.findMany({ where: a.where, orderBy: a.orderBy, skip: a.skip, take: a.take, select: { id: true } })).map((r) => r.id);
  const addId = !!a.select && !a.select.id;
  const rows: Row[] = [];
  for (let i = 0; i < ids.length; i += PART) {
    const part: Args = { ...a, where: { id: { in: ids.slice(i, i + PART) } }, skip: undefined, take: undefined };
    if (addId) part.select = { ...a.select, id: true };
    rows.push(...(await d.findMany(part)));
  }
  const pos = new Map(ids.map((id, i) => [id, i]));
  rows.sort((x, y) => (pos.get(x.id) ?? 0) - (pos.get(y.id) ?? 0));
  if (addId) for (const r of rows) delete (r as Partial<Row>).id;
  return rows;
}
async function readPart(d: Delegate, a: Args) {
  try {
    return await d.findMany(a);
  } catch (e) {
    if (!isLimit(e)) throw e;
    return safeFindMany(d, a);
  }
}

function withSafeCount(base: PrismaClient): PrismaClient {
  const delegateOf = (model: string) => (base as unknown as Record<string, Delegate>)[model.charAt(0).toLowerCase() + model.slice(1)];
  return base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          try {
            return await query(args);
          } catch (e) {
            if (!isLimit(e)) throw e;
            return (await safeFindMany(delegateOf(model), (args ?? {}) as Args)) as never;
          }
        },
        async count({ model, args, query }) {
          try {
            return await query(args);
          } catch (e) {
            if (!isLimit(e) || (args as { select?: unknown }).select) throw e;
            return (await readPart(delegateOf(model), { where: (args as Args).where, select: { id: true } })).length;
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
// Direct D1 access for a few hot reads (counts, code index): far less CPU than going through Prisma
export const d1 = () => getCloudflareContext().env.DB;
export async function sqlAll<T>(query: string, ...values: unknown[]): Promise<T[]> {
  return ((
    await d1()
      .prepare(query)
      .bind(...values)
      .all<T>()
  ).results ?? []) as T[];
}
export async function sqlFirst<T>(query: string, ...values: unknown[]): Promise<T | null> {
  return (
    (await d1()
      .prepare(query)
      .bind(...values)
      .first<T>()) ?? null
  );
}
export const db = new Proxy({} as PrismaClient, {
  get(_t, key) {
    const c = client() as unknown as Record<PropertyKey, unknown>;
    const v = c[key];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
});
