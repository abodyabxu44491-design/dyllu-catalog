// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
export const metadata = {
  title: "لوحة التحكم",
  robots: { index: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: { capable: true, title: "DYLLU Admin" },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin-login");
  const newOrders = await db.order.count({ where: { status: "NEW" } });
  return (
    <div dir="rtl" lang="ar" className="admin min-h-screen bg-soft lg:flex">
      <AdminNav newOrders={newOrders} admin={{ name: admin.name, email: admin.email }} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 lg:pb-10">{children}</div>
      </main>
    </div>
  );
}
