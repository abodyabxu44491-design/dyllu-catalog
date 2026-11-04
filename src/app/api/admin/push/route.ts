// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Admin notifications: create one, then the admin page calls "send" repeatedly until every device is reached.
import { z } from "zod";
import { db } from "@/lib/db";
import { currentAdmin, denyUnlessAdmin } from "@/lib/adminAuth";
import { audienceWhere, sendGroup, vapid } from "@/lib/push";
import { sendPush } from "@/lib/webpush";
export const dynamic = "force-dynamic";
const link = z
  .string()
  .trim()
  .max(500)
  .default("/")
  .refine((v) => v.startsWith("/") && !v.startsWith("//"), "الرابط يجب أن يكون صفحة من الموقع");
const Msg = z.object({
  title: z.string().trim().min(1, "اكتب عنوان الإشعار").max(70, "العنوان طويل"),
  body: z.string().trim().min(1, "اكتب نص الإشعار").max(240, "النص طويل"),
  url: link,
  image: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .refine((v) => !v || v.startsWith("/uploads/") || v.startsWith("https://"), "صورة غير صالحة"),
});
const A = z.discriminatedUnion("action", [
  Msg.extend({ action: z.literal("create"), audience: z.enum(["store", "all"]).default("store") }),
  z.object({ action: z.literal("send"), id: z.number().int() }),
  Msg.extend({ action: z.literal("test"), endpoint: z.string().max(1000) }),
]);
const payload = (m: { title: string; body: string; url: string; image?: string | null }, tag: string) => ({
  title: m.title,
  body: m.body,
  url: m.url || "/",
  image: m.image || undefined,
  tag,
});
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const p = A.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: p.error.issues[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
  const x = p.data;
  const v = vapid();
  if (!v) return Response.json({ error: "الإشعارات غير مفعلة على الخادم بعد (المفاتيح تُنشأ مع النشر)" }, { status: 503 });
  if (x.action === "test") {
    // Only to a device already registered here, never to an arbitrary address
    const s = await db.pushSubscription.findUnique({ where: { endpoint: x.endpoint } });
    if (!s) return Response.json({ error: "فعّل الإشعارات على هذا الجهاز أولًا" }, { status: 400 });
    const r = await sendPush(s, payload(x, "test"), v);
    if (r.gone) await db.pushSubscription.delete({ where: { id: s.id } });
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: `لم يقبل الجهاز الإشعار (${r.status})` }, { status: 502 });
  }
  if (x.action === "create") {
    const total = await db.pushSubscription.count({ where: audienceWhere(x.audience) });
    if (!total) return Response.json({ error: "لا يوجد أجهزة مفعّل عليها الإشعارات بعد" }, { status: 400 });
    const a = await db.announcement.create({
      data: {
        title: x.title,
        body: x.body,
        url: x.url,
        image: x.image || null,
        audience: x.audience,
        total,
        createdBy: (await currentAdmin())?.name ?? null,
      },
    });
    return Response.json({ id: a.id, total });
  }
  const a = await db.announcement.findUnique({ where: { id: x.id } });
  if (!a) return Response.json({ error: "الإشعار غير موجود" }, { status: 404 });
  if (a.status === "done") return Response.json({ ...a, done: true });
  const g = await sendGroup(a.audience, a.lastId, payload(a, `ann-${a.id}`));
  const u = await db.announcement.update({
    where: { id: a.id },
    data: {
      sent: { increment: g.sent },
      failed: { increment: g.failed },
      lastId: g.lastId,
      ...(g.done ? { status: "done", finishedAt: new Date() } : {}),
    },
  });
  return Response.json({ sent: u.sent, failed: u.failed, total: u.total, done: g.done });
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (id) await db.announcement.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}
