// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { orderWhere } from "@/lib/admin/orders";
import { STATUS_AR } from "@/lib/admin/labels";
export async function GET(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const os = await db.order.findMany({
    where: orderWhere(sp),
    include: { customer: true, rep: true, items: true, wholesaleCode: true },
    orderBy: { id: "desc" },
    take: 10000,
  });
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s;
  };
  const head = [
    "رقم الطلب",
    "التاريخ",
    "الحالة",
    "العميل",
    "الجوال",
    "الشركة",
    "المدينة",
    "المندوب",
    "جملة",
    "كود الجملة",
    "المنتجات",
    "عدد القطع",
    "الإجمالي",
    "سعر غير محدد",
    "مصدر QR",
    "ملاحظات",
  ];
  const rows = os.map((o) => [
    o.number,
    o.createdAt.toISOString().slice(0, 16).replace("T", " "),
    STATUS_AR[o.status],
    o.customer.name,
    o.customer.phone,
    o.customer.company,
    o.customer.city,
    o.rep?.name,
    o.isWholesale ? "نعم" : "لا",
    o.wholesaleCode?.name,
    o.items.map((i) => `${i.nameSnapshot} × ${i.quantity}`).join(" | "),
    o.items.reduce((n, i) => n + i.quantity, 0),
    Number(o.total ?? 0),
    o.hasUnpriced ? "نعم" : "",
    o.source,
    o.notes,
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dyllu-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
