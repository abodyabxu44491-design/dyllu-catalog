// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Notifications to phones that installed the app and allowed them (Web Push).
// Keys live in Cloudflare secrets VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (created on the first deploy).
import { after } from "next/server";
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
// "store" (offers, ads, announcements) reaches every device that turned notifications on, including the
// admin's and reps' phones, so the team sees exactly what customers receive
export const audienceWhere = (audience: string) => (audience === "store" || audience === "all" ? {} : { audience });

export const GROUP = 25; // devices per step
// One group of devices. The group is claimed first (lastId moves only if nobody else moved it), so the
// automatic sender, the 5-minute check and the admin page can run at the same time without sending twice.
export async function sendNext(id: number) {
  const v = vapid();
  if (!v) throw new Error("مفاتيح الإشعارات غير مضبوطة بعد");
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a || a.status !== "sending") return { done: true, sent: a?.sent ?? 0, failed: a?.failed ?? 0, total: a?.total ?? 0 };
  const subs = await db.pushSubscription.findMany({
    where: { ...audienceWhere(a.audience), id: { gt: a.lastId } },
    orderBy: { id: "asc" },
    take: GROUP,
  });
  const done = subs.length < GROUP;
  const claimed = await db.announcement.updateMany({
    where: { id, lastId: a.lastId, status: "sending" },
    data: { lastId: subs.at(-1)?.id ?? a.lastId, ...(done ? { status: "done", finishedAt: new Date() } : {}) },
  });
  if (!claimed.count) return { done: false, sent: a.sent, failed: a.failed, total: a.total }; // another sender took it
  const msg = { title: a.title, body: a.body, url: a.url || "/", image: a.image || undefined, tag: `ann-${a.id}` };
  const results = await Promise.all(subs.map((s) => sendPush(s, msg, v)));
  const gone = subs.filter((_, i) => results[i].gone).map((s) => s.id);
  if (gone.length) await db.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  const sent = results.filter((r) => r.ok).length,
    failed = results.length - sent;
  const u = await db.announcement.update({ where: { id }, data: { sent: { increment: sent }, failed: { increment: failed } } });
  return { done, sent: u.sent, failed: u.failed, total: u.total };
}
// Sends until finished or the time budget is used (what is left continues on the next 5-minute check)
export async function drain(id: number, budgetMs = 20_000) {
  const t0 = Date.now();
  for (let i = 0; i < 400 && Date.now() - t0 < budgetMs; i++) if ((await sendNext(id)).done) return true;
  return false;
}
// Scheduled ones whose time has come start now; unfinished ones continue
export async function drainDue(budgetMs = 20_000) {
  const now = new Date();
  const due = await db.announcement.findMany({
    where: { OR: [{ status: "sending" }, { status: "scheduled", sendAt: { lte: now } }] },
    orderBy: { id: "asc" },
    take: 10,
  });
  for (const a of due) {
    if (a.status === "scheduled") {
      const total = await db.pushSubscription.count({ where: audienceWhere(a.audience) });
      await db.announcement.updateMany({ where: { id: a.id, status: "scheduled" }, data: { status: "sending", total } });
    }
    await drain(a.id, budgetMs);
  }
  return due.length;
}

// New offer or ad: one notification to every device, now or when it starts. A later save of the same item
// replaces a notification that has not gone out yet instead of adding another.
export async function announce(
  m: { title: string; body: string; url: string; image?: string | null },
  opts: { source: string; startsAt?: Date | null; createdBy?: string | null },
) {
  const later = opts.startsAt && opts.startsAt.getTime() > Date.now() + 60_000 ? opts.startsAt : null;
  await db.announcement.deleteMany({ where: { source: opts.source, status: "scheduled" } });
  const total = await db.pushSubscription.count({ where: audienceWhere("store") });
  if (!total && !later) return { id: null, total: 0, scheduled: false };
  const a = await db.announcement.create({
    data: {
      title: m.title.slice(0, 70),
      body: m.body.slice(0, 240),
      url: m.url || "/",
      image: m.image || null,
      audience: "store",
      total,
      status: later ? "scheduled" : "sending",
      sendAt: later,
      source: opts.source,
      createdBy: opts.createdBy ?? null,
    },
  });
  if (!later)
    try {
      after(() => drain(a.id).catch(() => {}));
    } catch {
      await drain(a.id).catch(() => {});
    }
  return { id: a.id, total, scheduled: !!later, sendAt: later };
}
