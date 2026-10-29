// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "../db";
import { externalStorage, publicUrl, putObject } from "../storage";

// Every column that can hold an uploaded file link ("/uploads/<name>")
const REFS: [table: string, column: string][] = [
  ["ProductImage", "url"],
  ["ProductDocument", "url"],
  ["Category", "image"],
  ["Banner", "image"],
  ["Rep", "photo"],
  ["Setting", "value"],
];

export async function uploadsStatus() {
  const agg = await db.upload.aggregate({ _count: true, _sum: { size: true } });
  return { configured: externalStorage(), count: agg._count, bytes: agg._sum.size ?? 0 };
}

// Moves a few files per call: copy to external storage, point every link to the new address, then free the database row.
// A file is removed from the database only after its copy is stored and its links are updated.
export async function moveBatch(size = 10) {
  if (!externalStorage()) throw new Error("التخزين الخارجي غير مضبوط بعد");
  const rows = await db.upload.findMany({ orderBy: { id: "asc" }, take: size });
  for (const r of rows) {
    try {
      await putObject(r.name, r.data, r.type);
    } catch {
      throw new Error("تعذر الاتصال بالتخزين الخارجي. تأكد من مفاتيح S3 ورابط S3_ENDPOINT ثم حاول مرة أخرى، ولم يُحذف أي ملف");
    }
    const from = `/uploads/${r.name}`,
      to = publicUrl(r.name);
    await db.$transaction([
      ...REFS.map(([t, c]) => db.$executeRawUnsafe(`UPDATE "${t}" SET "${c}" = $1 WHERE "${c}" = $2`, to, from)),
      db.upload.delete({ where: { id: r.id } }),
    ]);
  }
  return { moved: rows.length, remaining: await db.upload.count() };
}
