import { z } from "zod";
import { db } from "./db";
import { priceOf } from "./format";
// الواجهة ترسل productId + quantity فقط. السعر دائمًا من قاعدة البيانات، وسعر الجملة يحدده كوكي موقّع من السيرفر.
export const orderInput = z.object({
  customer: z.object({ name: z.string().trim().max(80).optional(), phone: z.string().trim().min(8).max(20), company: z.string().trim().max(80).optional(), city: z.string().trim().max(60).optional() }),
  notes: z.string().max(1000).optional(),
  source: z.string().max(60).optional(),
  repId: z.number().int().optional(),
  items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int().min(1).max(999) })).min(1),
});
export async function createOrder(raw: unknown, ws: { id: number } | null = null) {
  const input = orderInput.parse(raw);
  const rep = input.repId ? await db.rep.findFirst({ where: { id: input.repId, isActive: true } }) : null;
  if (input.repId && !rep) throw new Error("مندوب غير متاح");
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) }, isActive: true, allowCart: true } });
  const map = new Map(products.map((p) => [p.id, p]));
  if (input.items.some((i) => !map.has(i.productId))) throw new Error("منتج غير متاح");
  let total = 0, hasUnpriced = false;
  const items = input.items.map((i) => {
    const p = map.get(i.productId)!, v = priceOf(p, !!ws);
    if (v != null) total += v * i.quantity; else hasUnpriced = true;
    return { productId: p.id, nameSnapshot: p.nameEn, unitPrice: v, quantity: i.quantity };
  });
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({ data: { ...input.customer, name: input.customer.name || "بدون اسم" } });
    const o = await tx.order.create({ data: { number: crypto.randomUUID(), customerId: customer.id, notes: input.notes, source: input.source, total, hasUnpriced, repId: rep?.id, isWholesale: !!ws, wholesaleCodeId: ws?.id, items: { create: items } } });
    return tx.order.update({ where: { id: o.id }, data: { number: `DY-${10000 + o.id}` }, include: { items: true, customer: true, rep: true } });
  });
}
