// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sqlFirst } from "./db";
import { REP_COOKIE, verifyRepSession } from "./session";
export const currentRep = cache(async () => {
  const s = await verifyRepSession((await cookies()).get(REP_COOKIE)?.value);
  if (!s) return null;
  const a = await sqlFirst<{
    isActive: number;
    sessionVersion: number;
    id: number;
    name: string;
    location: string;
    phone: string;
    photo: string | null;
    repActive: number;
  }>(
    `SELECT a."isActive", a."sessionVersion", r."id", r."name", r."location", r."phone", r."photo", r."isActive" "repActive"
     FROM "RepAccount" a JOIN "Rep" r ON r."id" = a."repId" WHERE a."repId" = ?`,
    s.id,
  );
  return a && a.isActive && a.sessionVersion === s.ver
    ? { id: a.id, name: a.name, location: a.location, phone: a.phone, photo: a.photo, isActive: !!a.repActive }
    : null;
});
export async function denyUnlessRep() {
  return (await currentRep()) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
export const repCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 30 * 86400,
};
