// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// A device turns notifications on or off. Public: no account is needed to receive offers.
import { z } from "zod";
import { db } from "@/lib/db";
import { vapid } from "@/lib/push";
import { b64u, isPushEndpoint } from "@/lib/webpush";
export const dynamic = "force-dynamic";
const key = (bytes: number) =>
  z
    .string()
    .max(200)
    .refine((s) => {
      try {
        return b64u.decode(s).length === bytes;
      } catch {
        return false;
      }
    });
const Sub = z.object({
  endpoint: z.string().max(1000).refine(isPushEndpoint, "unsupported push service"),
  keys: z.object({ p256dh: key(65), auth: key(16) }),
  audience: z.enum(["store", "admin", "rep", "trade"]).default("store"),
  lang: z.enum(["ar", "en"]).default("ar"),
});
export async function GET() {
  return Response.json({ key: vapid()?.publicKey ?? null });
}
export async function POST(req: Request) {
  const p = Sub.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "invalid subscription" }, { status: 400 });
  const { endpoint, keys, audience, lang } = p.data;
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, audience, lang },
    update: { p256dh: keys.p256dh, auth: keys.auth, audience, lang, lastSeenAt: new Date() },
  });
  return Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  const endpoint = String((await req.json().catch(() => ({})))?.endpoint ?? "");
  if (endpoint) await db.pushSubscription.deleteMany({ where: { endpoint } });
  return Response.json({ ok: true });
}
