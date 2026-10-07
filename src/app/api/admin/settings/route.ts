import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const b = (await req.json()) as Record<string, string>;
  await db.$transaction(Object.entries(b).map(([key, value]) => db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })));
  return NextResponse.json({ ok: true });
}
