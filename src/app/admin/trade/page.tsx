// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/siteUrl";
import { tradeKey } from "@/lib/session";
import TradeManager from "@/components/admin/TradeManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "تطبيق أصحاب المحلات" };
export default async function TradePage() {
  const [codes, scans, withBarcode, total] = await Promise.all([
    db.wholesaleCode.findMany({
      orderBy: [{ tradeAccess: "desc" }, { id: "desc" }],
      include: { _count: { select: { scans: true } } },
    }),
    db.tradeScan.findMany({ orderBy: { id: "desc" }, take: 30, include: { code: { select: { name: true } } } }),
    db.product.count({ where: { isActive: true, barcode: { not: null } } }),
    db.product.count({ where: { isActive: true } }),
  ]);
  const ids = scans.map((s) => s.productId).filter((x): x is number => x != null);
  const names = new Map(
    (await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, nameAr: true } })).map((p) => [p.id, p.nameAr]),
  );
  const base = await siteUrl(),
    links = new Map(
      await Promise.all(codes.map(async (c) => [c.id, `${base}/trade?k=${await tradeKey(c.id, c.sessionVersion)}`] as const)),
    );
  return (
    <TradeManager
      now={Date.now()}
      coverage={{ withBarcode, total }}
      shops={codes.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        phone: c.phone ?? "",
        link: links.get(c.id)!,
        isActive: c.isActive,
        tradeAccess: c.tradeAccess,
        lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
        scans: c._count.scans,
      }))}
      scans={scans.map((s) => ({
        id: s.id,
        shop: s.code.name,
        barcode: s.barcode,
        product: s.productId ? (names.get(s.productId) ?? "منتج محذوف") : null,
        productId: s.productId,
        at: s.createdAt.toISOString(),
      }))}
    />
  );
}
