import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import Icon from "./Icon";
import LangToggle from "./LangToggle";
import CartButton from "./CartButton";
import LogoTap from "./LogoTap";
import WsBar from "./WsBar";
// هيدر ثابت: الشعار (3 ضغطات متتالية = كود الجملة) + اللغة + السلة. شريط الهوية الثلاثي أسفله.
export default async function SiteHeader({ back }: { back?: string }) {
  const [s, ws] = await Promise.all([getSettings(), getWholesale()]), L = getLang();
  return (<div className="sticky top-0 z-40">{ws && <WsBar name={ws.name} />}
    <header className="relative bg-white h-16 px-4 flex items-center justify-between after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-gradient-to-r after:from-lime after:via-accent after:to-steel">
      {back ? <Link href={back} className="font-bold text-steel"><span className="inline-flex items-center gap-1"><Icon n="chev" s={18} className="rotate-180 rtl:rotate-0" />{L === "en" ? "Back" : "رجوع"}</span></Link>
        : <LogoTap><span className="flex items-center gap-2.5"><img src={s["logo.url"] || "/brand/logo-wordmark.png"} alt={s["site.name"] || "DYLLU"} className="h-9 w-auto max-w-[150px] object-contain" /></span></LogoTap>}
      <div className="flex items-center gap-2"><LangToggle lang={L} /><CartButton lang={L} ws={!!ws} /></div></header></div>);
}
