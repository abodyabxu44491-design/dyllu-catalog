// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { cdb } from "@/lib/cache";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await cdb.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
}
