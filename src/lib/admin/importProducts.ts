import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import { db } from "../db";
import { englishFor } from "../translate";
import { saveUpload } from "../storage";
// استيراد المنتجات من Excel: صف = منتج. رقم الموديل (SKU) الموجود يُحدَّث (الخانات الفارغة لا تمسح الموجود)، وغيره يُنشأ.
// التصنيف يُربط بالموجود بالاسم أو يُنشأ. الإنجليزية تُترجم تلقائيًا. رابط الصورة (اختياري) يُنزَّل ويُضغط.
export const ImportRow = z.object({
  row: z.number().int(), name: z.string().trim().min(1, "اسم المنتج فارغ"), category: z.string().trim().min(1, "التصنيف فارغ"),
  price: z.number().nonnegative().nullable(), wholesale: z.number().nonnegative().nullable(), sku: z.string().trim().max(60).nullable(),
  description: z.string().trim().max(5000).nullable(), features: z.array(z.string().trim().min(1)).max(30), specs: z.array(z.tuple([z.string().trim().min(1), z.string().trim()])).max(40),
  image: z.string().trim().url("رابط الصورة غير صحيح").nullable(), inStock: z.boolean().nullable(), isActive: z.boolean().nullable(), isFeatured: z.boolean().nullable(),
});
export type ImportRowT = z.infer<typeof ImportRow>;
export type ImportResult = { row: number; ok: boolean; action?: "created" | "updated"; id?: number; error?: string; warning?: string };

// منع تنزيل روابط داخلية (حماية السيرفر): نسمح فقط بعناوين عامة عبر http/https
const PRIVATE = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|f[cd]|fe80:)/i;
async function safeUrl(url: string | URL) {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol)) throw new Error("رابط الصورة يجب أن يبدأ بـ https://");
  const host = u.hostname.replace(/^\[|\]$/g, ""), addr = isIP(host) ? host : (await lookup(host)).address;
  if (PRIVATE.test(addr) || host === "localhost") throw new Error("رابط الصورة غير مسموح");
  return u;
}
async function fetchImage(url: string): Promise<string> {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 15000);
  try {
    // التحويلات (redirect) تُتبع يدويًا ويُفحص كل عنوان، حتى لا يقود رابط عام إلى عنوان داخلي
    let u = await safeUrl(url), r = await fetch(u, { signal: ctrl.signal, redirect: "manual" });
    for (let n = 0; r.status >= 300 && r.status < 400 && r.headers.get("location") && n < 4; n++) { u = await safeUrl(new URL(r.headers.get("location")!, u)); r = await fetch(u, { signal: ctrl.signal, redirect: "manual" }); }
    const type = (r.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) throw new Error("الرابط ليس صورة JPG/PNG/WEBP");
    if (Number(r.headers.get("content-length") ?? 0) > 15e6) throw new Error("الصورة أكبر من 15MB");
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 15e6) throw new Error("الصورة أكبر من 15MB");
    return saveUpload(new File([buf], "image", { type }));
  } catch (e) { throw (e as Error).name === "AbortError" ? new Error("انتهت مهلة تنزيل الصورة") : e; }
  finally { clearTimeout(t); }
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function categoryId(name: string, cache: Map<string, number>) {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  let c = await db.category.findFirst({ where: { OR: [{ nameAr: { equals: name.trim(), mode: "insensitive" } }, { nameEn: { equals: name.trim(), mode: "insensitive" } }] }, select: { id: true } });
  if (!c) {
    const [nameEn] = await englishFor([{ ar: name, title: true }]), max = await db.category.aggregate({ _max: { sortOrder: true } });
    c = await db.category.create({ data: { nameAr: name.trim(), nameEn, slug: `${slugify(nameEn) || "cat"}-${Date.now().toString(36)}`, sortOrder: (max._max.sortOrder ?? 0) + 1, isActive: true }, select: { id: true } });
  }
  cache.set(key, c.id);
  return c.id;
}

export async function importRows(rows: ImportRowT[]): Promise<ImportResult[]> {
  const cats = new Map<string, number>(), out: ImportResult[] = [];
  for (const r of rows) {
    try {
      const catId = await categoryId(r.category, cats);
      const prev = r.sku ? await db.product.findUnique({ where: { sku: r.sku }, include: { specs: true, features: true, images: { select: { id: true } } } }) : null;
      const fe = new Map((prev?.features ?? []).map((f) => [f.textAr.trim(), f.textEn])), sn = new Map((prev?.specs ?? []).map((x) => [x.nameAr.trim(), x.nameEn])), sv = new Map((prev?.specs ?? []).map((x) => [x.value.trim(), x.valueEn ?? ""]));
      const keep = (m: Map<string, string>, k: string) => (m.has(k.trim()) ? { prevAr: k, prevEn: m.get(k.trim()) } : {});
      const en = await englishFor([
        { ar: r.name, prevAr: prev?.nameAr, prevEn: prev?.nameEn, title: true }, { ar: r.description, prevAr: prev?.descriptionAr, prevEn: prev?.descriptionEn },
        ...r.features.map((f) => ({ ar: f, ...keep(fe, f) })), ...r.specs.map(([n]) => ({ ar: n, ...keep(sn, n), title: true })), ...r.specs.map(([, v]) => ({ ar: v, ...keep(sv, v) }))]);
      let i = 2;
      const features = r.features.map((textAr, k) => ({ textAr, textEn: en[i++], sortOrder: k }));
      const sNames = r.specs.map(() => en[i++]), sVals = r.specs.map(() => en[i++]);
      const specs = r.specs.map(([nameAr, value], k) => ({ nameAr, nameEn: sNames[k], value, valueEn: sVals[k] !== value ? sVals[k] : null, sortOrder: k }));
      let image: string | null = null, warning: string | undefined;
      if (r.image) { try { image = await fetchImage(r.image); } catch (e) { warning = `الصورة: ${(e as Error).message}`; } }
      // الخانات الفارغة في الملف لا تمسح القيم الموجودة عند التحديث
      const data = { nameAr: r.name, nameEn: en[0], categoryId: catId, ...(r.description != null && { descriptionAr: r.description, descriptionEn: en[1] || null }),
        ...(r.price != null && { price: r.price }), ...(r.wholesale != null && { wholesalePrice: r.wholesale }), ...(r.inStock != null && { inStock: r.inStock }), ...(r.isActive != null && { isActive: r.isActive }), ...(r.isFeatured != null && { isFeatured: r.isFeatured }) };
      if (prev) {
        await db.$transaction([
          ...(r.features.length ? [db.productFeature.deleteMany({ where: { productId: prev.id } })] : []), ...(r.specs.length ? [db.productSpec.deleteMany({ where: { productId: prev.id } })] : []),
          db.product.update({ where: { id: prev.id }, data: { ...data, ...(r.features.length && { features: { create: features } }), ...(r.specs.length && { specs: { create: specs } }),
            ...(image && { images: { create: [{ url: image, sortOrder: prev.images.length, isPrimary: prev.images.length === 0 }] } }) } })]);
        out.push({ row: r.row, ok: true, action: "updated", id: prev.id, warning });
      } else {
        const p = await db.product.create({ data: { ...data, slug: `${slugify(en[0]) || "p"}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, sku: r.sku || null, showPrice: true,
          features: { create: features }, specs: { create: specs }, ...(image && { images: { create: [{ url: image, sortOrder: 0, isPrimary: true }] } }) } });
        out.push({ row: r.row, ok: true, action: "created", id: p.id, warning });
      }
    } catch (e) { out.push({ row: r.row, ok: false, error: (e as { code?: string }).code === "P2002" ? "رقم الموديل مكرر" : (e as Error).message }); }
  }
  return out;
}
