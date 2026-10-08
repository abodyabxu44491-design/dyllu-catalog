// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { z } from "zod";
import { db } from "./db";
import { priceOf } from "./format";
import { isPhone, normalizePhone, toAsciiDigits } from "./phone";
import { withOffers } from "./offers";
export const orderInput = z.object({
  customer: z.object({
    name: z.string({ required_error: "اكتب الاسم" }).trim().min(2, "اكتب الاسم").max(80),
    phone: z
      .string({ required_error: "اكتب رقم الجوال" })
      .trim()
      .max(32)
      .transform(toAsciiDigits)
      .refine(isPhone, "رقم الجوال غير مكتمل، اكتبه مثل 0551234567"),
    company: z.string().trim().max(80).optional(),
    city: z.string().trim().max(60).optional(),
  }),
  notes: z.string().max(1000).optional(),
  source: z.string().max(60).optional(),
  repId: z.number().int().optional(),
  items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int().min(1).max(999) })).min(1),
});
export async function createOrder(raw: unknown, ws: { id: number } | null = null) {
  const input = orderInput.parse(raw);
  const rep = input.repId ? await db.rep.findFirst({ where: { id: input.repId, isActive: true } }) : null;
  if (input.repId && !rep) throw new Error("مندوب غير متاح");
  const products = await withOffers(
    await db.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) }, isActive: true, allowCart: true } }),
  );
  const map = new Map(products.map((p) => [p.id, p]));
  if (input.items.some((i) => !map.has(i.productId))) throw new Error("منتج غير متاح");
  let total = 0,
    hasUnpriced = false;
  const items = input.items.map((i) => {
    const p = map.get(i.productId)!,
      v = priceOf(p, !!ws);
    if (v != null) total += v * i.quantity;
    else hasUnpriced = true;
    return { productId: p.id, nameSnapshot: p.nameAr || p.nameEn, skuSnapshot: p.sku, unitPrice: v, quantity: i.quantity };
  });
  const store = input.source ? await db.store.findUnique({ where: { code: input.source } }) : null;
  return db.$transaction(async (tx) => {
    const { name, phone, company, city } = input.customer,
      phoneKey = normalizePhone(phone);
    const fresh = Object.fromEntries(Object.entries({ name, phone, company, city }).filter(([, v]) => v));
    const customer = await tx.customer.upsert({ where: { phoneKey }, update: fresh, create: { ...fresh, phone, phoneKey, name } });
    const o = await tx.order.create({
      data: {
        number: crypto.randomUUID(),
        customerId: customer.id,
        notes: input.notes,
        source: input.source,
        storeId: store?.id,
        total,
        hasUnpriced,
        repId: rep?.id,
        isWholesale: !!ws,
        wholesaleCodeId: ws?.id,
        items: { create: items },
      },
    });
    return tx.order.update({
      where: { id: o.id },
      data: { number: `DY-${10000 + o.id}` },
      include: { items: true, customer: true, rep: true, store: true },
    });
  });
}
