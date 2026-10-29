// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { bustStore } from "./cache";
import { SESSION_COOKIE, verifySession } from "./session";
export const currentAdmin = cache(async () => {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const u = await db.adminUser.findUnique({ where: { id: s.id }, select: { id: true, email: true, name: true, sessionVersion: true } });
  return u && u.sessionVersion === s.ver ? u : null;
});
export async function denyUnlessAdmin() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  bustStore();
  return null;
}
