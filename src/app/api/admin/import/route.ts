// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { bustStore } from "@/lib/cache";
import { errMsg } from "@/lib/apiError";
import { analyze, commitChunk, commitFinish, commitStart, prepare, undoChunk, undoPlan, type RawRow } from "@/lib/admin/excelImport";
export const maxDuration = 60;
const Row = z
  .object({ row: z.number().int().min(1) })
  .catchall(z.union([z.string().max(5000), z.number()]).transform((v) => String(v)))
  .transform((r) => r as unknown as RawRow);
const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("analyze"),
    mode: z.enum(["full", "stock"]),
    rows: z.array(Row).min(1).max(5000),
    createCategories: z.boolean().default(false),
  }),
  z.object({ action: z.literal("prepare"), rows: z.array(Row).min(1).max(10) }),
  z.object({
    action: z.literal("commitStart"),
    mode: z.enum(["full", "stock"]),
    rows: z.array(Row).min(1).max(5000),
    createCategories: z.boolean().default(false),
    fileName: z.string().max(200).default(""),
  }),
  z.object({
    action: z.literal("commitChunk"),
    logId: z.number().int(),
    mode: z.enum(["full", "stock"]),
    rows: z.array(Row).min(1).max(25),
    prepared: z.array(z.any()).max(25).default([]),
  }),
  z.object({ action: z.literal("commitFinish"), logId: z.number().int() }),
  z.object({ action: z.literal("undoPlan"), id: z.number().int() }),
  z.object({ action: z.literal("undoChunk"), id: z.number().int() }),
]);
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  bustStore();
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "بيانات الملف غير صحيحة" }, { status: 400 });
  const x = b.data,
    who = admin.name || admin.email;
  try {
    if (x.action === "analyze") {
      const { results, summary, newCategories } = await analyze(x.mode, x.rows, x.createCategories);
      return NextResponse.json({ results, summary, newCategories });
    }
    if (x.action === "prepare") return NextResponse.json({ prepared: await prepare(x.rows) });
    if (x.action === "commitStart")
      return NextResponse.json(
        await commitStart(x.mode, x.rows, { createCategories: x.createCategories, fileName: x.fileName, admin: who }),
      );
    if (x.action === "commitChunk") return NextResponse.json(await commitChunk(x.logId, x.mode, x.rows, x.prepared));
    if (x.action === "commitFinish") return NextResponse.json(await commitFinish(x.logId));
    if (x.action === "undoPlan") {
      const { log, ...plan } = await undoPlan(x.id);
      return NextResponse.json({ ...plan, fileName: log.fileName });
    }
    return NextResponse.json(await undoChunk(x.id, who));
  } catch (e) {
    return NextResponse.json({ error: errMsg(e, "كود منتج أو باركود مكرر، أعد المعاينة") }, { status: 400 });
  }
}
export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const logs = await db.importLog.findMany({
    orderBy: { id: "desc" },
    take: 30,
    select: {
      id: true,
      kind: true,
      fileName: true,
      adminName: true,
      created: true,
      updated: true,
      rejected: true,
      status: true,
      undoneAt: true,
      undoneBy: true,
      createdAt: true,
    },
  });
  return NextResponse.json(logs);
}
