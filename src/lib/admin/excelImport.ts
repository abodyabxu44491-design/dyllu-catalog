// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Excel product import keyed by product code (model number):
//   analyze  -> what each row would do (create / update / unchanged / error), nothing is written
//   prepare  -> English translations and downloaded images for rows that need them (small batches)
//   commit   -> applies all valid rows in one database transaction and logs previous values
//   undo     -> restores the previous values of the latest import
// Products that are not in the file are never touched.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { englishFor } from "../translate";
import { saveUpload } from "../storage";
import { toAsciiDigits } from "../phone";
import { barcodeVariants, normalizeBarcode } from "../barcode";
import { normalizeSku } from "./products";

export type Mode = "full" | "stock";
export type RawRow = {
  row: number;
  sku?: string;
  name?: string;
  categories?: string;
  price?: string;
  wholesale?: string;
  stock?: string;
  barcode?: string;
  description?: string;
  features?: string;
  specs?: string;
  image?: string;
  isActive?: string;
  isFeatured?: string;
  inStock?: string;
};
type Parsed = {
  row: number;
  sku: string;
  name?: string;
  categories?: string[];
  price?: number | null;
  wholesale?: number | null;
  stock?: number | null;
  barcode?: string | null;
  description?: string;
  features?: string[];
  specs?: [string, string][];
  image?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
};
export type Prepared = {
  row: number;
  en: { name?: string; description?: string; features?: string[]; specs?: [string, string][] };
  image?: string | null;
  imageError?: string;
};
export type RowResult = {
  row: number;
  sku: string;
  name: string;
  action: "create" | "update" | "same" | "error";
  errors: string[];
  changes: [string, string, string][];
  becomesOut: boolean;
  needsPrep: boolean;
  productId?: number;
};
const LABEL: Record<string, string> = {
  nameAr: "الاسم",
  price: "السعر",
  wholesalePrice: "سعر الجملة",
  stock: "الكمية",
  inStock: "التوفر",
  barcode: "الباركود",
  categoryId: "التصنيف",
  categories: "التصنيفات الإضافية",
  descriptionAr: "الوصف",
  features: "المميزات",
  specs: "المواصفات",
  image: "صورة",
  isActive: "الظهور",
  isFeatured: "مميز",
};

const str = (v?: string) => (v ?? "").toString().trim();
const list = (v?: string) =>
  str(v)
    .split(/\s*[|\n؛;،]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
// undefined = cell empty (keep current value); NaN = not a number (row error)
function num(v?: string): number | undefined {
  const s = toAsciiDigits(str(v))
    .replace(/[,٬\s]|ريال|ر\.?س|sar/gi, "")
    .replace("٫", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
function bool(v?: string): boolean | undefined {
  const s = str(v).toLowerCase();
  if (!s) return undefined;
  if (/^(نعم|ايوه|أيوه|yes|y|true|1|✓|✔|x)$/.test(s)) return true;
  if (/^(لا|no|n|false|0)$/.test(s)) return false;
  return undefined;
}
function parseRow(mode: Mode, r: RawRow, errors: string[]): Parsed {
  const sku = normalizeSku(r.sku);
  const p: Parsed = { row: r.row, sku };
  const stock = num(r.stock);
  if (stock !== undefined) {
    if (Number.isNaN(stock) || !Number.isInteger(stock)) errors.push("الكمية يجب أن تكون رقمًا صحيحًا");
    else if (stock < 0) errors.push("الكمية لا تكون بالسالب");
    else p.stock = stock;
  }
  if (mode === "stock") {
    if (stock === undefined) errors.push("الكمية فارغة");
    return p;
  }
  if (str(r.name)) p.name = str(r.name);
  const cats = list(r.categories);
  if (cats.length) p.categories = [...new Map(cats.map((c) => [c.toLowerCase(), c])).values()];
  for (const [k, label] of [
    ["price", "السعر"],
    ["wholesale", "سعر الجملة"],
  ] as const) {
    const v = num(r[k]);
    if (v === undefined) continue;
    if (Number.isNaN(v)) errors.push(`${label} ليس رقمًا`);
    else if (v < 0) errors.push(`${label} لا يكون بالسالب`);
    else p[k] = v;
  }
  if (str(r.barcode)) p.barcode = normalizeBarcode(r.barcode) || null;
  if (str(r.description)) p.description = str(r.description);
  const fe = list(r.features);
  if (fe.length) p.features = fe;
  const sp = list(r.specs).map((x): [string, string] => {
    const m = x.match(/^(.+?)\s*[:：=]\s*(.+)$/);
    return m ? [m[1].trim(), m[2].trim()] : [x, ""];
  });
  if (sp.some(([, v]) => !v)) errors.push("مواصفة بدون قيمة (اكتبها: الاسم: القيمة)");
  else if (sp.length) p.specs = sp;
  if (str(r.image)) {
    if (!/^https?:\/\/\S+$/i.test(str(r.image))) errors.push("رابط الصورة غير صحيح");
    else p.image = str(r.image);
  }
  p.isActive = bool(r.isActive);
  p.isFeatured = bool(r.isFeatured);
  if (p.stock === undefined) p.inStock = bool(r.inStock);
  return p;
}
const ex = {
  categories: { select: { id: true } },
  features: { orderBy: { sortOrder: "asc" as const } },
  specs: { orderBy: { sortOrder: "asc" as const } },
  images: { select: { id: true } },
};
type Existing = Prisma.ProductGetPayload<{ include: typeof ex }>;
async function categoryMap() {
  const all = await db.category.findMany({ select: { id: true, nameAr: true, nameEn: true } });
  const m = new Map<string, number>();
  for (const c of all) {
    m.set(c.nameAr.trim().toLowerCase(), c.id);
    if (c.nameEn) m.set(c.nameEn.trim().toLowerCase(), c.id);
  }
  return m;
}
const n2 = (v: unknown) => (v == null ? null : Number(v));
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export async function analyze(mode: Mode, raw: RawRow[], createCategories = false) {
  const errs = new Map<number, string[]>(raw.map((r) => [r.row, []]));
  const rows = raw.map((r) => parseRow(mode, r, errs.get(r.row)!));
  // Duplicate codes and barcodes inside the file reject every copy
  const bySku = new Map<string, number[]>(),
    byBc = new Map<string, number[]>();
  for (const p of rows) {
    if (!p.sku) errs.get(p.row)!.push("كود المنتج فارغ");
    else bySku.set(p.sku, [...(bySku.get(p.sku) ?? []), p.row]);
    if (p.barcode) byBc.set(p.barcode, [...(byBc.get(p.barcode) ?? []), p.row]);
  }
  const dupRows = new Set<number>();
  for (const [, at] of bySku)
    if (at.length > 1) for (const r of at) (dupRows.add(r), errs.get(r)!.push(`الكود مكرر في الملف (الصفوف ${at.join("، ")})`));
  for (const [, at] of byBc) if (at.length > 1) for (const r of at) errs.get(r)!.push(`الباركود مكرر في الملف (الصفوف ${at.join("، ")})`);
  const skus = [...bySku.keys()];
  const existing: Existing[] = skus.length
    ? await db.product.findMany({ where: { OR: skus.map((s) => ({ sku: { equals: s, mode: "insensitive" as const } })) }, include: ex })
    : [];
  const bySkuDb = new Map(existing.map((p) => [normalizeSku(p.sku), p]));
  const bcs = [...byBc.keys()].flatMap((b) => barcodeVariants(b));
  const bcOwners = bcs.length
    ? await db.product.findMany({ where: { barcode: { in: bcs } }, select: { id: true, barcode: true, nameAr: true } })
    : [];
  const cats = mode === "full" ? await categoryMap() : new Map<string, number>();
  const newCats = new Set<string>();
  const results: RowResult[] = rows.map((p) => {
    const e = errs.get(p.row)!,
      cur = p.sku ? bySkuDb.get(p.sku) : undefined;
    const base = {
      row: p.row,
      sku: p.sku,
      name: p.name ?? cur?.nameAr ?? "",
      changes: [] as [string, string, string][],
      becomesOut: false,
      needsPrep: false,
      productId: cur?.id,
    };
    if (mode === "stock") {
      if (p.sku && !cur) e.push("الكود غير موجود في المنتجات");
      if (e.length || !cur) return { ...base, action: "error" as const, errors: e };
      const changes: [string, string, string][] = [];
      if (cur.stock !== p.stock) changes.push([LABEL.stock, cur.stock == null ? "غير متتبَّع" : String(cur.stock), String(p.stock)]);
      const out = p.stock === 0 && cur.inStock;
      return { ...base, action: changes.length ? ("update" as const) : ("same" as const), errors: [], changes, becomesOut: out };
    }
    if (!cur) {
      if (!p.name) e.push("اسم المنتج فارغ (مطلوب للمنتج الجديد)");
      if (!p.categories?.length) e.push("التصنيف فارغ (مطلوب للمنتج الجديد)");
    }
    for (const c of p.categories ?? [])
      if (!cats.has(c.toLowerCase())) {
        newCats.add(c);
        if (!createCategories) e.push(`تصنيف جديد: ${c}`);
      }
    if (p.barcode) {
      const owner = bcOwners.find((o) => barcodeVariants(p.barcode).includes(o.barcode!) && o.id !== cur?.id);
      if (owner) e.push(`الباركود مستخدم للمنتج «${owner.nameAr}»`);
    }
    if (e.length) return { ...base, action: "error" as const, errors: e };
    if (!cur) return { ...base, action: "create" as const, errors: [], needsPrep: true, changes: [] };
    const changes: [string, string, string][] = [];
    const ch = (k: string, a: unknown, b: unknown) =>
      changes.push([LABEL[k], a == null || a === "" ? "—" : String(a), b == null || b === "" ? "—" : String(b)]);
    if (p.name !== undefined && p.name !== cur.nameAr) ch("nameAr", cur.nameAr, p.name);
    if (p.price !== undefined && p.price !== n2(cur.price)) ch("price", n2(cur.price), p.price);
    if (p.wholesale !== undefined && p.wholesale !== n2(cur.wholesalePrice)) ch("wholesalePrice", n2(cur.wholesalePrice), p.wholesale);
    if (p.stock !== undefined && p.stock !== cur.stock) ch("stock", cur.stock ?? "غير متتبَّع", p.stock);
    if (p.barcode !== undefined && p.barcode !== cur.barcode) ch("barcode", cur.barcode, p.barcode);
    if (p.description !== undefined && p.description !== (cur.descriptionAr ?? "")) ch("descriptionAr", "…", "تعديل");
    if (
      p.features &&
      !sameList(
        p.features,
        cur.features.map((f) => f.textAr),
      )
    )
      ch("features", cur.features.length, p.features.length);
    if (
      p.specs &&
      !sameList(
        p.specs.map((s) => s.join(":")),
        cur.specs.map((s) => `${s.nameAr}:${s.value}`),
      )
    )
      ch("specs", cur.specs.length, p.specs.length);
    if (p.categories?.length) {
      const primary = cats.get(p.categories[0].toLowerCase());
      if (primary !== undefined && primary !== cur.categoryId) ch("categoryId", "", p.categories[0]);
      const extra = p.categories
        .slice(1)
        .map((c) => cats.get(c.toLowerCase()) ?? -1)
        .sort()
        .join(",");
      if (
        extra !==
          cur.categories
            .map((c) => c.id)
            .sort()
            .join(",") ||
        primary === undefined
      )
        ch("categories", "", p.categories.slice(1).join("، ") || "—");
    }
    if (p.image) ch("image", "", "إضافة");
    if (p.isActive !== undefined && p.isActive !== cur.isActive)
      ch("isActive", cur.isActive ? "ظاهر" : "مخفي", p.isActive ? "ظاهر" : "مخفي");
    if (p.isFeatured !== undefined && p.isFeatured !== cur.isFeatured)
      ch("isFeatured", cur.isFeatured ? "نعم" : "لا", p.isFeatured ? "نعم" : "لا");
    if (p.stock === undefined && p.inStock !== undefined && p.inStock !== cur.inStock)
      ch("inStock", cur.inStock ? "متوفر" : "غير متوفر", p.inStock ? "متوفر" : "غير متوفر");
    const out = cur.inStock && (p.stock === 0 || (p.stock === undefined && p.inStock === false));
    const needsPrep = (p.name !== undefined && p.name !== cur.nameAr) || !!p.description || !!p.features || !!p.specs || !!p.image;
    return { ...base, action: changes.length ? ("update" as const) : ("same" as const), errors: [], changes, becomesOut: out, needsPrep };
  });
  const count = (a: RowResult["action"]) => results.filter((r) => r.action === a).length;
  return {
    results,
    summary: {
      create: count("create"),
      update: count("update"),
      same: count("same"),
      errors: count("error"),
      duplicates: dupRows.size,
      out: results.filter((r) => r.becomesOut && r.action !== "error").length,
    },
    newCategories: [...newCats],
    parsed: rows,
    existing: bySkuDb,
  };
}

const PRIVATE =
  /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|f[cd]|fe80:)/i;
async function safeUrl(url: string | URL) {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol)) throw new Error("رابط الصورة يجب أن يبدأ بـ https://");
  const host = u.hostname.replace(/^\[|\]$/g, ""),
    addr = isIP(host) ? host : (await lookup(host)).address;
  if (PRIVATE.test(addr) || host === "localhost") throw new Error("رابط الصورة غير مسموح");
  return u;
}
async function fetchImage(url: string): Promise<string> {
  const ctrl = new AbortController(),
    t = setTimeout(() => ctrl.abort(), 15000);
  try {
    let u = await safeUrl(url),
      r = await fetch(u, { signal: ctrl.signal, redirect: "manual" });
    for (let n = 0; r.status >= 300 && r.status < 400 && r.headers.get("location") && n < 4; n++) {
      u = await safeUrl(new URL(r.headers.get("location")!, u));
      r = await fetch(u, { signal: ctrl.signal, redirect: "manual" });
    }
    const type = (r.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) throw new Error("الرابط ليس صورة JPG/PNG/WEBP");
    if (Number(r.headers.get("content-length") ?? 0) > 15e6) throw new Error("الصورة أكبر من 15MB");
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 15e6) throw new Error("الصورة أكبر من 15MB");
    return saveUpload(new File([buf], "image", { type }));
  } catch (e) {
    throw (e as Error).name === "AbortError" ? new Error("انتهت مهلة تنزيل الصورة") : e;
  } finally {
    clearTimeout(t);
  }
}

// Translations keep the previous English text when the Arabic did not change
export async function prepare(raw: RawRow[]): Promise<Prepared[]> {
  const out: Prepared[] = [];
  for (const r of raw) {
    const p = parseRow("full", r, []);
    const cur = p.sku
      ? await db.product.findFirst({ where: { sku: { equals: p.sku, mode: "insensitive" } }, include: { features: true, specs: true } })
      : null;
    const fe = new Map((cur?.features ?? []).map((f) => [f.textAr.trim(), f.textEn])),
      sn = new Map((cur?.specs ?? []).map((x) => [x.nameAr.trim(), x.nameEn])),
      sv = new Map((cur?.specs ?? []).map((x) => [x.value.trim(), x.valueEn ?? ""]));
    const keep = (m: Map<string, string>, k: string) => (m.has(k.trim()) ? { prevAr: k, prevEn: m.get(k.trim()) } : {});
    const en = await englishFor([
      { ar: p.name ?? cur?.nameAr, prevAr: cur?.nameAr, prevEn: cur?.nameEn, title: true },
      { ar: p.description, prevAr: cur?.descriptionAr, prevEn: cur?.descriptionEn },
      ...(p.features ?? []).map((f) => ({ ar: f, ...keep(fe, f) })),
      ...(p.specs ?? []).map(([n]) => ({ ar: n, ...keep(sn, n), title: true })),
      ...(p.specs ?? []).map(([, v]) => ({ ar: v, ...keep(sv, v) })),
    ]);
    let i = 2;
    const features = (p.features ?? []).map(() => en[i++]);
    const sNames = (p.specs ?? []).map(() => en[i++]),
      sVals = (p.specs ?? []).map(() => en[i++]);
    const prep: Prepared = {
      row: r.row,
      en: {
        name: en[0] || undefined,
        description: p.description ? en[1] || undefined : undefined,
        features: p.features ? features : undefined,
        specs: p.specs ? sNames.map((n, k): [string, string] => [n, sVals[k]]) : undefined,
      },
    };
    if (p.image)
      try {
        prep.image = await fetchImage(p.image);
      } catch (e) {
        prep.imageError = (e as Error).message;
      }
    out.push(prep);
  }
  return out;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
type Snap = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  price: number | null;
  wholesalePrice: number | null;
  stock: number | null;
  inStock: boolean;
  barcode: string | null;
  categoryId: number;
  isActive: boolean;
  isFeatured: boolean;
  categories: number[];
  features?: { textAr: string; textEn: string }[];
  specs?: { nameAr: string; nameEn: string; value: string; valueEn: string | null }[];
};
const snap = (p: Existing): Snap => ({
  nameAr: p.nameAr,
  nameEn: p.nameEn,
  descriptionAr: p.descriptionAr,
  descriptionEn: p.descriptionEn,
  price: n2(p.price),
  wholesalePrice: n2(p.wholesalePrice),
  stock: p.stock,
  inStock: p.inStock,
  barcode: p.barcode,
  categoryId: p.categoryId,
  isActive: p.isActive,
  isFeatured: p.isFeatured,
  categories: p.categories.map((c) => c.id),
});
export type Change = { id: number; sku: string; op: "create" | "update"; before?: Snap; addedImages?: number[] };

export async function commit(
  mode: Mode,
  raw: RawRow[],
  opts: { createCategories: boolean; fileName: string; admin: string; prepared: Prepared[] },
) {
  const a = await analyze(mode, raw, opts.createCategories);
  const prep = new Map(opts.prepared.map((p) => [p.row, p]));
  const todo = a.results.filter((r) => r.action === "create" || r.action === "update");
  // Rows that need translation/images but were not prepared get them now (small files only)
  const missing = todo.filter((r) => mode === "full" && r.needsPrep && !prep.has(r.row));
  if (missing.length > 25) throw new Error("أعد المعاينة ثم التأكيد");
  for (const p of await prepare(raw.filter((x) => missing.some((m) => m.row === x.row)))) prep.set(p.row, p);
  const parsed = new Map(a.parsed.map((p) => [p.row, p]));
  const changes: Change[] = [],
    createdCategories: number[] = [];
  await db.$transaction(
    async (tx) => {
      const cats = await categoryMap();
      if (mode === "full" && opts.createCategories)
        for (const name of a.newCategories) {
          const [nameEn] = await englishFor([{ ar: name, title: true }]);
          const max = await tx.category.aggregate({ _max: { sortOrder: true } });
          const c = await tx.category.create({
            data: {
              nameAr: name,
              nameEn,
              slug: `${slugify(nameEn) || "cat"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
              sortOrder: (max._max.sortOrder ?? 0) + 1,
              isActive: true,
            },
          });
          cats.set(name.toLowerCase(), c.id);
          createdCategories.push(c.id);
        }
      for (const r of todo) {
        const p = parsed.get(r.row)!,
          cur = a.existing.get(p.sku),
          pr = prep.get(r.row);
        if (mode === "stock") {
          await tx.product.update({ where: { id: cur!.id }, data: { stock: p.stock, inStock: (p.stock ?? 0) > 0 } });
          changes.push({ id: cur!.id, sku: p.sku, op: "update", before: snap(cur!) });
          continue;
        }
        const catIds = (p.categories ?? []).map((c) => cats.get(c.toLowerCase())).filter((x): x is number => x !== undefined);
        const data: Prisma.ProductUncheckedUpdateInput = {
          ...(p.name !== undefined && { nameAr: p.name }),
          ...(pr?.en.name && { nameEn: pr.en.name }),
          ...(p.description !== undefined && { descriptionAr: p.description, descriptionEn: pr?.en.description ?? null }),
          ...(p.price !== undefined && { price: p.price }),
          ...(p.wholesale !== undefined && { wholesalePrice: p.wholesale }),
          ...(p.stock !== undefined && { stock: p.stock, inStock: (p.stock ?? 0) > 0 }),
          ...(p.stock === undefined && p.inStock !== undefined && { inStock: p.inStock }),
          ...(p.barcode !== undefined && { barcode: p.barcode }),
          ...(p.isActive !== undefined && { isActive: p.isActive }),
          ...(p.isFeatured !== undefined && { isFeatured: p.isFeatured }),
          ...(catIds.length && { categoryId: catIds[0] }),
        };
        const features = p.features?.map((textAr, k) => ({ textAr, textEn: pr?.en.features?.[k] ?? textAr, sortOrder: k }));
        const specs = p.specs?.map(([nameAr, value], k) => {
          const [nEn, vEn] = pr?.en.specs?.[k] ?? [nameAr, value];
          return { nameAr, nameEn: nEn || nameAr, value, valueEn: vEn && vEn !== value ? vEn : null, sortOrder: k };
        });
        if (!cur) {
          const created = await tx.product.create({
            data: {
              ...(data as Prisma.ProductUncheckedCreateInput),
              nameAr: p.name!,
              nameEn: pr?.en.name || p.name!,
              sku: p.sku,
              categoryId: catIds[0],
              slug: `${slugify(pr?.en.name ?? "") || "p"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
              showPrice: true,
              categories: { connect: catIds.slice(1).map((id) => ({ id })) },
              features: { create: features ?? [] },
              specs: { create: specs ?? [] },
              ...(pr?.image && { images: { create: [{ url: pr.image, sortOrder: 0, isPrimary: true }] } }),
            },
          });
          changes.push({ id: created.id, sku: p.sku, op: "create" });
          continue;
        }
        const before: Snap = {
          ...snap(cur),
          ...(features && { features: cur.features.map((f) => ({ textAr: f.textAr, textEn: f.textEn })) }),
          ...(specs && { specs: cur.specs.map((s) => ({ nameAr: s.nameAr, nameEn: s.nameEn, value: s.value, valueEn: s.valueEn })) }),
        };
        if (features) await tx.productFeature.deleteMany({ where: { productId: cur.id } });
        if (specs) await tx.productSpec.deleteMany({ where: { productId: cur.id } });
        await tx.product.update({
          where: { id: cur.id },
          data: {
            ...data,
            ...(catIds.length && {
              categories: {
                set: catIds
                  .slice(1)
                  .filter((id) => id !== catIds[0])
                  .map((id) => ({ id })),
              },
            }),
            ...(features && { features: { create: features } }),
            ...(specs && { specs: { create: specs } }),
          },
        });
        let addedImages: number[] | undefined;
        if (pr?.image) {
          const img = await tx.productImage.create({
            data: { productId: cur.id, url: pr.image, sortOrder: cur.images.length, isPrimary: cur.images.length === 0 },
          });
          addedImages = [img.id];
        }
        changes.push({ id: cur.id, sku: p.sku, op: "update", before, addedImages });
      }
      await tx.importLog.create({
        data: {
          kind: mode,
          fileName: opts.fileName.slice(0, 200) || "ملف",
          adminName: opts.admin,
          created: changes.filter((c) => c.op === "create").length,
          updated: changes.filter((c) => c.op === "update").length,
          rejected: a.summary.errors,
          changes: { items: changes, createdCategories } as unknown as Prisma.InputJsonValue,
        },
      });
    },
    { timeout: 120_000, maxWait: 15_000 },
  );
  return {
    created: changes.filter((c) => c.op === "create").length,
    updated: changes.filter((c) => c.op === "update").length,
    rejected: a.summary.errors,
    same: a.summary.same,
    imageErrors: [...prep.values()].filter((p) => p.imageError).map((p) => ({ row: p.row, error: p.imageError! })),
  };
}

type LogChanges = { items: Change[]; createdCategories: number[] };
// Only the most recent import that has not been undone can be undone
export async function undoPlan(id: number) {
  const latest = await db.importLog.findFirst({ where: { undoneAt: null }, orderBy: { id: "desc" } });
  if (!latest || latest.id !== id) throw new Error("يمكن التراجع عن آخر عملية استيراد فقط");
  const { items } = latest.changes as unknown as LogChanges;
  const ids = items.map((c) => c.id);
  const prods = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, sku: true, nameAr: true, updatedAt: true, _count: { select: { items: true } } },
  });
  const after = new Date(latest.createdAt.getTime() + 5000);
  return {
    log: latest,
    restore: items.filter((c) => c.op === "update").length,
    remove: items.filter((c) => c.op === "create" && prods.find((p) => p.id === c.id && p._count.items === 0)).length,
    hide: items.filter((c) => c.op === "create" && prods.find((p) => p.id === c.id && p._count.items > 0)).length,
    // Products edited again after the import: undo overwrites those later edits
    conflicts: prods.filter((p) => p.updatedAt > after).map((p) => ({ id: p.id, sku: p.sku, name: p.nameAr })),
  };
}
export async function undo(id: number, admin: string) {
  const plan = await undoPlan(id);
  const { items, createdCategories } = plan.log.changes as unknown as LogChanges;
  await db.$transaction(
    async (tx) => {
      for (const c of [...items].reverse()) {
        const p = await tx.product.findUnique({ where: { id: c.id }, select: { id: true, _count: { select: { items: true } } } });
        if (!p) continue;
        if (c.op === "create") {
          if (p._count.items > 0) await tx.product.update({ where: { id: c.id }, data: { isActive: false } });
          else await tx.product.delete({ where: { id: c.id } });
          continue;
        }
        const b = c.before!;
        if (b.features) {
          await tx.productFeature.deleteMany({ where: { productId: c.id } });
          await tx.productFeature.createMany({ data: b.features.map((f, k) => ({ ...f, productId: c.id, sortOrder: k })) });
        }
        if (b.specs) {
          await tx.productSpec.deleteMany({ where: { productId: c.id } });
          await tx.productSpec.createMany({ data: b.specs.map((s, k) => ({ ...s, productId: c.id, sortOrder: k })) });
        }
        if (c.addedImages?.length) await tx.productImage.deleteMany({ where: { id: { in: c.addedImages } } });
        const { categories, features: _f, specs: _s, ...scalars } = b;
        await tx.product.update({ where: { id: c.id }, data: { ...scalars, categories: { set: categories.map((x) => ({ id: x })) } } });
      }
      for (const cid of createdCategories) {
        const used = await tx.product.count({ where: { categoryId: cid } });
        if (!used) await tx.category.delete({ where: { id: cid } });
      }
      await tx.importLog.update({ where: { id }, data: { undoneAt: new Date(), undoneBy: admin } });
    },
    { timeout: 120_000, maxWait: 15_000 },
  );
  return { restored: plan.restore, removed: plan.remove, hidden: plan.hide };
}
