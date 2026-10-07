"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
const TABS: [string, string, IconName][] = [["/rep", "الرئيسية", "dash"], ["/rep/orders", "طلباتي", "orders"], ["/rep/customers", "عملائي", "user"], ["/rep/account", "حسابي", "settings"]];
// حساب المندوب: شريط علوي + تبويبات (أعلى على الكمبيوتر، أسفل الشاشة على الجوال)
export default function RepNav({ name, photo, newOrders }: { name: string; photo?: string | null; newOrders: number }) {
  const path = usePathname(), on = (h: string) => (h === "/rep" ? path === h : path.startsWith(h));
  const tab = (h: string, t: string, i: IconName, mobile: boolean) => (<Link key={h} href={h} aria-current={on(h) ? "page" : undefined}
    className={mobile ? `relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on(h) ? "text-ink" : "text-steel"}` : `relative flex items-center gap-2 rounded-xl px-3.5 h-10 text-sm font-bold transition ${on(h) ? "bg-lime text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
    <span className={mobile ? `grid place-items-center w-12 h-7 rounded-full ${on(h) ? "bg-lime" : ""}` : ""}><Icon n={i} s={mobile ? 20 : 18} /></span>{t}
    {h === "/rep/orders" && newOrders > 0 && <b className={`absolute ${mobile ? "top-0 start-1/2 ms-2" : "-top-1 -end-1"} min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] grid place-items-center px-1`}>{newOrders}</b>}</Link>);
  return (<>
    <header className="print:hidden sticky top-0 z-40 bg-ink text-white border-b-[3px] border-lime">
      <div className="max-w-5xl mx-auto flex items-center gap-3 h-14 md:h-16 px-4 sm:px-6">
        <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-7 md:h-8 w-auto" />
        <span className="text-[11px] font-bold text-ink bg-lime rounded-full px-2.5 py-0.5">حساب المندوب</span>
        <nav className="hidden md:flex items-center gap-1 ms-6">{TABS.map(([h, t, i]) => tab(h, t, i, false))}</nav>
        <span className="ms-auto flex items-center gap-2 min-w-0"><b className="hidden sm:block text-sm truncate">{name}</b>
          <span className="w-9 h-9 rounded-full bg-white/10 text-lime grid place-items-center font-extrabold overflow-hidden shrink-0">{photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : name[0]}</span></span>
      </div>
    </header>
    <nav className="print:hidden md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-line grid grid-cols-4 h-[64px] pb-safe">{TABS.map(([h, t, i]) => tab(h, t, i, true))}</nav>
  </>);
}
