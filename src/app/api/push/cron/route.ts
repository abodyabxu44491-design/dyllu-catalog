// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Called by the Worker's 5-minute schedule (worker.ts), never from outside: sends notifications whose time has
// come (offers and ads that start later) and finishes any send that was interrupted.
import { timingSafeEqual } from "node:crypto";
import { drainDue, vapid } from "@/lib/push";
import { sessionSecret } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const key = Buffer.from(req.headers.get("x-dyllu-cron") ?? ""),
    secret = Buffer.from(sessionSecret());
  if (!secret.length || key.length !== secret.length || !timingSafeEqual(key, secret)) return new Response("Not found", { status: 404 });
  if (!vapid()) return Response.json({ handled: 0, ready: false });
  return Response.json({ handled: await drainDue(25_000) });
}
