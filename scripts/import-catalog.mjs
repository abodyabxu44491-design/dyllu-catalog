// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export async function importCatalog(db, log = console.log) {
  const dir = path.join(process.cwd(), "prisma/catalog"),
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
  const row = await db.setting.findUnique({ where: { key: "catalog.imported" } }),
    done = new Set(row ? JSON.parse(row.value) : []);
  let added = 0;
  for (const f of files) {
    const { categories, products } = JSON.parse(readFileSync(path.join(dir, f), "utf8")),
      cats = {};
    for (const p of products) {
      if (done.has(p.slug)) continue;
      if (await db.product.findUnique({ where: { slug: p.slug }, select: { id: true } })) {
        done.add(p.slug);
        continue;
      }
      if (p.sku && (await db.product.findUnique({ where: { sku: p.sku }, select: { id: true } }))) {
        done.add(p.slug);
        continue;
      }
      if (!cats[p.cat]) {
        const c = categories[p.cat];
        const found = await db.category.findFirst({
          where: { OR: [{ slug: p.cat }, { nameAr: c.nameAr }, { nameEn: { equals: c.nameEn, mode: "insensitive" } }] },
        });
        const max = await db.category.aggregate({ _max: { sortOrder: true } });
        cats[p.cat] =
          found ??
          (await db.category.create({
            data: {
              slug: p.cat,
              nameAr: c.nameAr,
              nameEn: c.nameEn,
              subtitleAr: c.subtitleAr,
              subtitleEn: c.subtitleEn,
              image: c.image,
              sortOrder: (max._max.sortOrder ?? 0) + 1,
            },
          }));
      }
      const order = await db.product.count({ where: { categoryId: cats[p.cat].id } });
      await db.product.create({
        data: {
          slug: p.slug,
          sku: p.sku ?? null,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          descriptionAr: p.descriptionAr,
          descriptionEn: p.descriptionEn,
          price: null,
          showPrice: true,
          isActive: true,
          inStock: true,
          categoryId: cats[p.cat].id,
          sortOrder: order,
          images: { create: [{ url: p.image, sortOrder: 0, isPrimary: true }] },
          specs: { create: p.specs.map(([nameAr, nameEn, value], i) => ({ nameAr, nameEn, value, sortOrder: i })) },
          features: { create: p.features.map(([textAr, textEn], i) => ({ textAr, textEn, sortOrder: i })) },
        },
      });
      done.add(p.slug);
      added++;
    }
  }
  await db.setting.upsert({
    where: { key: "catalog.imported" },
    create: { key: "catalog.imported", value: JSON.stringify([...done]) },
    update: { value: JSON.stringify([...done]) },
  });
  log(added ? `✓ أُضيف ${added} منتج جديد إلى الكتالوج` : "✓ المنتجات الجاهزة موجودة مسبقًا");
  return added;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    await importCatalog(db, (m) => console.log(`[DYLLU] ${m}`));
  } catch (e) {
    console.log(`[DYLLU] ✗ تعذر استيراد المنتجات: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
