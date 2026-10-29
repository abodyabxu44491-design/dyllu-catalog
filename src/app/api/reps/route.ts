// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { cdb } from "@/lib/cache";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await cdb.rep.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true, location: true, photo: true },
  });
  return NextResponse.json(rows);
}
