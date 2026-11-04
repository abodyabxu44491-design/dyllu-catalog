// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Notifications to phones that installed the app and allowed them (Web Push).
// Keys live in Cloudflare secrets VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (created on the first deploy).
import { db } from "./db";
import { sendPush, type Vapid } from "./webpush";

export function vapid(): Vapid | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim(),
    privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  const host = (process.env.MAIN_DOMAIN || "dyllusa.com").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return { publicKey, privateKey, subject: `https://${host}` };
}

export type Message = { title: string; body: string; url: string; image?: string | null; tag?: string };
export const audienceWhere = (audience: string) => (audience === "all" ? {} : { audience });

// Free plan: about 10 ms of CPU and 50 outgoing requests per request, so each call sends a small group
export const GROUP = 8;
export async function sendGroup(audience: string, after: number, msg: Message) {
  const v = vapid();
  if (!v) throw new Error("مفاتيح الإشعارات غير مضبوطة بعد");
  const subs = await db.pushSubscription.findMany({
    where: { ...audienceWhere(audience), id: { gt: after } },
    orderBy: { id: "asc" },
    take: GROUP,
  });
  const results = await Promise.all(subs.map((s) => sendPush(s, msg, v)));
  const gone = subs.filter((_, i) => results[i].gone).map((s) => s.id);
  if (gone.length) await db.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    removed: gone.length,
    lastId: subs.at(-1)?.id ?? after,
    done: subs.length < GROUP,
  };
}
