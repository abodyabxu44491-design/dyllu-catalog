// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { arToEnMany, hasArabic, titleCase } from "../src/lib/translateCore.mjs";
const MAX = 600;
const empty = (v) => !v || !String(v).trim() || hasArabic(v);
export async function backfillEnglish(db, log = console.log) {
  const jobs = []; // { ar, title, apply: async (en) => {} }
  const add = (ar, title, apply) => {
    if (jobs.length < MAX && hasArabic(ar)) jobs.push({ ar: String(ar).trim(), title, apply });
  };
  for (const p of await db.product.findMany({
    select: { id: true, nameAr: true, nameEn: true, descriptionAr: true, descriptionEn: true },
  })) {
    if (empty(p.nameEn)) add(p.nameAr, true, (en) => db.product.update({ where: { id: p.id }, data: { nameEn: en } }));
    if (empty(p.descriptionEn) && !empty(p.descriptionAr))
      add(p.descriptionAr, false, (en) => db.product.update({ where: { id: p.id }, data: { descriptionEn: en } }));
  }
  for (const x of await db.productSpec.findMany()) {
    if (empty(x.nameEn)) add(x.nameAr, true, (en) => db.productSpec.update({ where: { id: x.id }, data: { nameEn: en } }));
    if (empty(x.valueEn)) add(x.value, false, (en) => db.productSpec.update({ where: { id: x.id }, data: { valueEn: en } }));
  }
  for (const x of await db.productFeature.findMany())
    if (empty(x.textEn)) add(x.textAr, false, (en) => db.productFeature.update({ where: { id: x.id }, data: { textEn: en } }));
  for (const x of await db.productDocument.findMany())
    if (empty(x.titleEn)) add(x.title, false, (en) => db.productDocument.update({ where: { id: x.id }, data: { titleEn: en } }));
  for (const c of await db.category.findMany()) {
    if (empty(c.nameEn)) add(c.nameAr, true, (en) => db.category.update({ where: { id: c.id }, data: { nameEn: en } }));
    if (empty(c.subtitleEn)) add(c.subtitleAr, false, (en) => db.category.update({ where: { id: c.id }, data: { subtitleEn: en } }));
    if (empty(c.descriptionEn))
      add(c.descriptionAr, false, (en) => db.category.update({ where: { id: c.id }, data: { descriptionEn: en } }));
  }
  for (const b of await db.banner.findMany())
    for (const k of ["title", "subtitle", "button", "badge"])
      if (empty(b[`${k}En`])) add(b[`${k}Ar`], false, (en) => db.banner.update({ where: { id: b.id }, data: { [`${k}En`]: en } }));
  const rows = await db.setting.findMany(),
    map = new Map(rows.map((r) => [r.key, r.value]));
  for (const r of rows)
    if (r.key.endsWith(".ar") && !/^(price\.hiddenLabel|currency)/.test(r.key)) {
      const k = r.key.slice(0, -3) + ".en";
      if (empty(map.get(k)))
        add(r.value, false, (en) => db.setting.upsert({ where: { key: k }, create: { key: k, value: en }, update: { value: en } }));
    }
  if (!jobs.length) return log("✓ النسخة الإنجليزية مكتملة");
  const out = await arToEnMany(jobs.map((j) => j.ar));
  let ok = 0;
  for (const [i, j] of jobs.entries())
    if (out[i]) {
      await j.apply(j.title ? titleCase(out[i]) : out[i]);
      ok++;
    }
  log(ok === jobs.length ? `✓ تُرجم ${ok} نص ناقص إلى الإنجليزية` : `ℹ تُرجم ${ok} من ${jobs.length} نص (الباقي في التشغيل القادم)`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    await backfillEnglish(db, (m) => console.log(`[DYLLU] ${m}`));
  } finally {
    await db.$disconnect();
  }
}
