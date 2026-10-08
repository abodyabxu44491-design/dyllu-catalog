// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
}
