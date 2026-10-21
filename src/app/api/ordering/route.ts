// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { orderingState } from "@/lib/ordering";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await orderingState(), { headers: { "Cache-Control": "no-store" } });
}
