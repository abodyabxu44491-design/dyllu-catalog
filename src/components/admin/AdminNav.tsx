"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const NAV: [string, string][] = [["/admin", "لوحة المعلومات"], ["/admin/banners", "الإعلانات"], ["/admin/products", "المنتجات"], ["/admin/categories", "التصنيفات"], ["/admin/orders", "الطلبات"], ["/admin/codes", "أكواد الجملة"], ["/admin/reps", "المناديب"], ["/admin/settings", "الإعدادات"], ["/admin/qr", "رموز QR"]];
export default function AdminNav() {
  const path = usePathname(), on = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  return (<aside className="relative bg-ink text-white md:w-60 md:min-h-screen md:sticky md:top-0 md:self-start shrink-0 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-gradient-to-r after:from-lime after:via-accent after:to-steel md:after:inset-x-auto md:after:inset-y-0 md:after:end-0 md:after:w-[3px] md:after:h-auto md:after:bg-gradient-to-b">
    <div className="flex md:block items-center gap-3 p-3 md:p-5">
      <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-7 md:h-9 w-auto object-contain md:mb-2" /><span className="hidden md:inline-block text-[11px] font-bold text-ink bg-lime rounded-full px-3 py-0.5 mb-5">لوحة التحكم</span>
      <nav className="flex md:flex-col gap-1 overflow-x-auto flex-1 md:overflow-visible">
        {NAV.map(([h, t]) => <Link key={h} href={h} className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${on(h) ? "bg-lime text-ink ps-7" : "text-white/80 hover:bg-white/10"}`}>{on(h) && <i className="absolute start-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rotate-45" />}{t}</Link>)}
      </nav>
      <div className="hidden md:flex md:flex-col gap-1 mt-6 text-sm"><Link href="/" target="_blank" className="rounded-xl px-3 py-2 text-white/80 hover:bg-white/10">عرض المتجر ↗</Link>
        <form action="/api/admin/logout" method="post"><button className="w-full text-start rounded-xl px-3 py-2 text-white/80 hover:bg-white/10">تسجيل الخروج</button></form></div>
      <form action="/api/admin/logout" method="post" className="md:hidden"><button className="text-sm text-white/80 whitespace-nowrap">خروج</button></form>
    </div></aside>);
}
