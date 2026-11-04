// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Hourly check of the Cloudflare free-plan usage. When a metric passes ALERT_PERCENT of its limit,
// one email per metric per day goes to the owner, so there is time to act before anything stops.
// Needs: secret CF_ANALYTICS_TOKEN (Account Analytics: Read), var CF_ACCOUNT_ID, var ALERT_EMAIL,
// var ALERT_FROM (an address on a domain onboarded to Cloudflare Email Service) and the EMAIL send binding.
import type { D1Database } from "@cloudflare/workers-types";

type Env = {
  DB: D1Database;
  EMAIL?: { send(m: { from: string; to: string; subject: string; text: string; html?: string }): Promise<unknown> };
  CF_ANALYTICS_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  ALERT_EMAIL?: string;
  ALERT_FROM?: string;
  ALERT_PERCENT?: string;
  USAGE_API_URL?: string;
};
type Metric = { key: string; label: string; used: number; limit: number; unit: string; resets: string };

// Workers Free / D1 / R2 free allowances (daily ones reset at 00:00 UTC = 3:00 Riyadh)
const LIMITS = {
  requests: 100_000,
  d1Read: 5_000_000,
  d1Write: 100_000,
  d1Storage: 5 * 1024 ** 3,
  r2Storage: 10 * 1024 ** 3,
};

async function gql(env: Env, query: string, vars: Record<string, unknown>) {
  const r = await fetch(env.USAGE_API_URL || "https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: vars }),
  });
  const d = (await r.json().catch(() => ({}))) as { data?: { viewer?: { accounts?: Record<string, unknown>[] } } };
  return d.data?.viewer?.accounts?.[0] ?? {};
}
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export async function readUsage(env: Env): Promise<Metric[]> {
  const day = new Date().toISOString().slice(0, 10);
  const vars = { a: env.CF_ACCOUNT_ID, d: day };
  const q = (body: string) => `query U($a: string!, $d: Date!) { viewer { accounts(filter: { accountTag: $a }) { ${body} } } }`;
  // Separate queries, so a dataset that is unavailable on the account does not hide the others
  const [w, d1, st, r2] = await Promise.all([
    gql(env, q(`x: workersInvocationsAdaptive(limit: 1, filter: { date_geq: $d, date_leq: $d }) { sum { requests } }`), vars),
    gql(env, q(`x: d1AnalyticsAdaptiveGroups(limit: 1, filter: { date_geq: $d, date_leq: $d }) { sum { rowsRead rowsWritten } }`), vars),
    gql(env, q(`x: d1StorageAdaptiveGroups(limit: 100, filter: { date_geq: $d, date_leq: $d }) { max { databaseSizeBytes } }`), vars),
    gql(
      env,
      q(`x: r2StorageAdaptiveGroups(limit: 100, filter: { date_geq: $d, date_leq: $d }) { max { payloadSize metadataSize } }`),
      vars,
    ),
  ]);
  type Rows = { sum?: Record<string, number>; max?: Record<string, number> }[];
  const rows = (o: Record<string, unknown>) => (Array.isArray(o.x) ? (o.x as Rows) : []);
  const sum = (o: Record<string, unknown>, k: string) => rows(o).reduce((n, r) => n + num(r.sum?.[k]), 0);
  const max = (o: Record<string, unknown>, ...k: string[]) => rows(o).reduce((n, r) => n + k.reduce((m, f) => m + num(r.max?.[f]), 0), 0);
  return [
    {
      key: "requests",
      label: "طلبات الموقع اليوم",
      used: sum(w, "requests"),
      limit: LIMITS.requests,
      unit: "طلب",
      resets: "يتجدد يوميًا 3:00 فجرًا",
    },
    {
      key: "d1Read",
      label: "قراءات قاعدة البيانات اليوم",
      used: sum(d1, "rowsRead"),
      limit: LIMITS.d1Read,
      unit: "صف",
      resets: "يتجدد يوميًا 3:00 فجرًا",
    },
    {
      key: "d1Write",
      label: "عمليات الحفظ في قاعدة البيانات اليوم",
      used: sum(d1, "rowsWritten"),
      limit: LIMITS.d1Write,
      unit: "صف",
      resets: "يتجدد يوميًا 3:00 فجرًا",
    },
    {
      key: "d1Storage",
      label: "حجم قاعدة البيانات",
      used: max(st, "databaseSizeBytes"),
      limit: LIMITS.d1Storage,
      unit: "بايت",
      resets: "مساحة دائمة",
    },
    {
      key: "r2Storage",
      label: "مساحة الصور والملفات",
      used: max(r2, "payloadSize", "metadataSize"),
      limit: LIMITS.r2Storage,
      unit: "بايت",
      resets: "مساحة دائمة",
    },
  ];
}

const fmt = (m: Metric, v: number) =>
  m.unit === "بايت"
    ? `${(v / 1024 ** 3).toLocaleString("en-US", { maximumFractionDigits: 2 })} GB`
    : `${Math.round(v).toLocaleString("en-US")} ${m.unit}`;

export async function runUsageAlert(env: Env) {
  if (!env.CF_ANALYTICS_TOKEN || !env.CF_ACCOUNT_ID || !env.ALERT_EMAIL || !env.ALERT_FROM || !env.EMAIL)
    return { skipped: "not configured" };
  const threshold = Number(env.ALERT_PERCENT || 70) / 100;
  const metrics = await readUsage(env);
  const day = new Date().toISOString().slice(0, 10);
  const hot: Metric[] = [];
  for (const m of metrics) {
    if (m.used < m.limit * threshold) continue;
    // One email per metric per day
    const key = `alert.sent.${m.key}`;
    const prev = await env.DB.prepare(`SELECT "value" FROM "Setting" WHERE "key" = ?`).bind(key).first<{ value: string }>();
    if (prev?.value === day) continue;
    hot.push(m);
    await env.DB.prepare(`INSERT INTO "Setting" ("key", "value") VALUES (?, ?) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value"`)
      .bind(key, day)
      .run();
  }
  if (!hot.length) return { sent: 0, metrics };
  const pct = (m: Metric) => Math.round((m.used / m.limit) * 100);
  const lines = hot.map((m) => `• ${m.label}: ${pct(m)}% (${fmt(m, m.used)} من ${fmt(m, m.limit)}) — ${m.resets}`);
  const all = metrics.map((m) => `- ${m.label}: ${pct(m)}%`);
  const text = [
    "تنبيه من موقع DYLLU",
    "",
    `وصل الاستهلاك إلى ${Math.round(threshold * 100)}% أو أكثر من الحد المجاني في:`,
    ...lines,
    "",
    "الموقع ما زال يعمل. الحدود اليومية تتجدد تلقائيًا كل يوم، أما المساحة فدائمة.",
    "إذا تكرر هذا التنبيه عدة أيام، فكّر في ترقية Cloudflare Workers إلى الخطة المدفوعة (5 دولار شهريًا) قبل أن يصل الحد 100%.",
    "",
    "كل المقاييس الآن:",
    ...all,
  ].join("\n");
  await env.EMAIL.send({
    from: env.ALERT_FROM,
    to: env.ALERT_EMAIL,
    subject: `تنبيه DYLLU: ${hot.map((m) => `${m.label} ${pct(m)}%`).join("، ")}`,
    text,
  });
  return { sent: hot.length, metrics };
}
