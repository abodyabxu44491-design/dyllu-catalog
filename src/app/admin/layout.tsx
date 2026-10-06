import AdminNav from "@/components/admin/AdminNav";
export const metadata = { title: "DYLLU | لوحة التحكم" };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (<div dir="rtl" lang="ar" className="admin min-h-screen bg-soft md:flex [overflow-x:clip]"><AdminNav /><div className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{children}</div></div>);
}
