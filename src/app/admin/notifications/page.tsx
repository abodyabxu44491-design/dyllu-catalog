// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import { vapid } from "@/lib/push";
import NotificationsManager from "@/components/admin/NotificationsManager";
export const dynamic = "force-dynamic";
export default async function Notifications() {
  const [store, admin, list, cats] = await Promise.all([
    db.pushSubscription.count({ where: { audience: "store" } }),
    db.pushSubscription.count({ where: { audience: { not: "store" } } }),
    db.announcement.findMany({ orderBy: { id: "desc" }, take: 30 }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, nameAr: true } }),
  ]);
  return (
    <NotificationsManager
      ready={!!vapid()}
      counts={{ store, other: admin }}
      cats={cats}
      history={list.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        url: a.url,
        status: a.status,
        total: a.total,
        sent: a.sent,
        failed: a.failed,
        by: a.createdBy,
        at: a.createdAt.toISOString(),
        sendAt: a.sendAt?.toISOString() ?? null,
        source: a.source,
      }))}
    />
  );
}
