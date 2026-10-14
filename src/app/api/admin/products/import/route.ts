// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { ImportRow, importRows } from "@/lib/admin/importProducts";
export const maxDuration = 60;
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const r = z.object({ rows: z.array(z.unknown()).min(1).max(10) }).safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const valid = [],
    results = [];
  for (const x of r.data.rows) {
    const v = ImportRow.safeParse(x);
    if (v.success) valid.push(v.data);
    else results.push({ row: Number((x as { row?: number })?.row) || 0, ok: false, error: v.error.issues[0]?.message ?? "صف غير صالح" });
  }
  return NextResponse.json({ results: [...results, ...(await importRows(valid))].sort((a, b) => a.row - b.row) });
}
