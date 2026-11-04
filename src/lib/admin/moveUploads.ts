// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "../db";
import { bucket, putObject } from "../storage";

// Files still stored in the database table are copied to R2 under the same name, so every
// existing "/uploads/<name>" link keeps working without being rewritten.
export async function uploadsStatus() {
  const agg = await db.upload.aggregate({ _count: true, _sum: { size: true } });
  return { configured: true, count: agg._count, bytes: agg._sum.size ?? 0 };
}

// A row is removed from the database only after its R2 copy is read back with the same size.
export async function moveBatch(size = 10) {
  const rows = await db.upload.findMany({ orderBy: { id: "asc" }, take: size });
  for (const r of rows) {
    try {
      await putObject(r.name, r.data, r.type);
    } catch {
      throw new Error("تعذر الحفظ في تخزين الصور (R2). حاول مرة أخرى، ولم يُحذف أي ملف");
    }
    const head = await bucket().head(r.name);
    if (!head || head.size !== r.data.length) throw new Error(`لم يتأكد حفظ الملف ${r.name} في R2، ولم يُحذف أي ملف`);
    await db.upload.delete({ where: { id: r.id } });
  }
  return { moved: rows.length, remaining: await db.upload.count() };
}
