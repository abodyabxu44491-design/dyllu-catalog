"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
type Item = [string, string, IconName];
const GROUPS: [string, Item[]][] = [
  ["", [["/admin", "لوحة المعلومات", "dash"]]],
  ["المبيعات", [["/admin/orders", "الطلبات", "orders"], ["/admin/reps", "المناديب", "users"], ["/admin/codes", "أكواد الجملة", "key"]]],
  ["الكتالوج", [["/admin/products", "المنتجات", "box"], ["/admin/categories", "التصنيفات", "grid"], ["/admin/banners", "الإعلانات", "megaphone"]]],
  ["النظام", [["/admin/settings", "الإعدادات", "settings"], ["/admin/qr", "رموز QR", "qr"]]],
];
const TABS: Item[] = [["/admin", "الرئيسية", "dash"], ["/admin/orders", "الطلبات", "orders"], ["/admin/products", "المنتجات", "box"]];
// كمبيوتر: شريط جانبي ثابت · جوال/تابلت: شريط علوي + قائمة منزلقة + تبويبات سفلية للصفحات الأكثر استخدامًا
export default function AdminNav({ newOrders, admin }: { newOrders: number; admin: { name: string; email: string } }) {
  const path = usePathname(), [open, setOpen] = useState(false), on = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const current = GROUPS.flatMap(([, i]) => i).find(([h]) => on(h))?.[1] ?? "لوحة التحكم";
  const nav = (<nav className="space-y-5">{GROUPS.map(([g, items]) => (<div key={g || "main"}>{g && <b className="block px-3 mb-1.5 text-[11px] font-bold text-white/40">{g}</b>}
    <div className="space-y-0.5">{items.map(([h, t, i]) => (<Link key={h} href={h} className={`relative flex items-center gap-3 rounded-xl px-3 h-11 text-sm font-bold transition ${on(h) ? "bg-lime text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
      {on(h) && <i className="absolute -start-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-s-[8px] border-s-accent" />}
      <Icon n={i} s={20} /><span className="flex-1">{t}</span>{h === "/admin/orders" && newOrders > 0 && <b className="min-w-[22px] h-[22px] rounded-full bg-accent text-white text-[11px] grid place-items-center px-1">{newOrders}</b>}</Link>))}</div></div>))}</nav>);
  const foot = (<div className="space-y-1 pt-4 border-t border-white/10">
    <div className="flex items-center gap-3 px-3 py-2"><span className="w-9 h-9 rounded-full bg-white/10 grid place-items-center font-extrabold text-lime">{(admin.name || admin.email)[0]?.toUpperCase()}</span><span className="min-w-0"><b className="block text-sm truncate">{admin.name}</b><small className="block text-xs text-white/50 truncate" dir="ltr">{admin.email}</small></span></div>
    <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 h-10 text-sm text-white/75 hover:bg-white/10"><Icon n="external" s={18} />عرض المتجر</Link>
    <form action="/api/admin/logout" method="post"><button className="w-full flex items-center gap-3 rounded-xl px-3 h-10 text-sm text-white/75 hover:bg-white/10 hover:text-accent"><Icon n="logout" s={18} />تسجيل الخروج</button></form></div>);
  return (<>
    {/* كمبيوتر */}
    <aside className="print:!hidden hidden lg:flex flex-col w-64 shrink-0 bg-ink text-white h-screen sticky top-0 border-e-[3px] border-lime">
      <div className="p-5 pb-4"><img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-9 w-auto" /><span className="inline-block mt-2 text-[11px] font-bold text-ink bg-lime rounded-full px-2.5 py-0.5">لوحة التحكم</span></div>
      <div className="flex-1 overflow-y-auto px-3 py-2">{nav}</div><div className="px-3 pb-4">{foot}</div>
    </aside>
    {/* جوال/تابلت: شريط علوي */}
    <header className="print:hidden lg:hidden sticky top-0 z-40 bg-ink text-white border-b-[3px] border-lime">
      <div className="flex items-center gap-3 h-14 px-4"><button aria-label="القائمة" onClick={() => setOpen(true)} className="btn-icon w-10 h-10 -ms-2 hover:bg-white/10"><Icon n="menu" s={22} /></button>
        <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-7 w-auto" /><b className="ms-auto text-sm text-white/80 truncate">{current}</b></div>
    </header>
    {open && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 start-0 w-[84%] max-w-xs bg-ink text-white flex flex-col animate-rise">
        <div className="flex items-center justify-between p-4"><img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-8 w-auto" /><button aria-label="إغلاق" onClick={() => setOpen(false)} className="btn-icon w-10 h-10 hover:bg-white/10"><Icon n="close" s={22} /></button></div>
        <div className="flex-1 overflow-y-auto px-4 py-2">{nav}</div><div className="px-4 pb-6 pb-safe">{foot}</div></div></div>}
    {/* جوال/تابلت: تبويبات سفلية */}
    <nav className="print:hidden lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line pb-safe"><div className="grid grid-cols-4 h-16">
      {TABS.map(([h, t, i]) => (<Link key={h} href={h} className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${on(h) ? "text-ink" : "text-steel"}`}>
        <span className={`relative grid place-items-center w-12 h-7 rounded-full ${on(h) ? "bg-lime" : ""}`}><Icon n={i} s={21} />{h === "/admin/orders" && newOrders > 0 && <b className="absolute -top-1.5 end-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] grid place-items-center border-2 border-white px-0.5">{newOrders}</b>}</span>{t}</Link>))}
      <button onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-steel"><span className="grid place-items-center w-12 h-7"><Icon n="menu" s={21} /></span>المزيد</button>
    </div></nav>
  </>);
}
