import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { currentAdmin } from "@/lib/adminAuth";
export const metadata = { title: "DYLLU | لوحة التحكم" };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await currentAdmin())) redirect("/admin-login");
  return (<div dir="rtl" lang="ar" className="admin min-h-screen bg-soft md:flex [overflow-x:clip]"><AdminNav /><div className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{children}</div></div>);
}
