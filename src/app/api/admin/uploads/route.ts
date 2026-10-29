// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { errMsg } from "@/lib/apiError";
import { moveBatch, uploadsStatus } from "@/lib/admin/moveUploads";
export const maxDuration = 60;
export async function GET() {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  return NextResponse.json(await uploadsStatus());
}
export async function POST() {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    return NextResponse.json(await moveBatch(10));
  } catch (e) {
    return NextResponse.json({ error: errMsg(e, "تعذر نقل الصور، تأكد من مفاتيح التخزين") }, { status: 400 });
  }
}
