// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getLang, txt } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import { orderingState } from "@/lib/ordering";
import Icon from "./Icon";
import LangToggle from "./LangToggle";
import CartButton from "./CartButton";
import LogoTap from "./LogoTap";
import WsBar from "./WsBar";
import HeaderNav from "./HeaderNav";
import SearchBox from "./SearchBox";
import MobileSearch from "./MobileSearch";
import InstallApp from "./InstallApp";
export default async function SiteHeader() {
  const [s, ws, cats, ordering] = await Promise.all([getSettings(), getWholesale(), getNavCategories(), orderingState()]);
  const L = await getLang(),
    en = L === "en",
    cur = en ? s["currency.en"] || "SAR" : s["currency.ar"],
    hidden = en ? "Contact us" : s["price.hiddenLabel.ar"],
    ph = txt(s, L, "search.ph");
  return (
    <div className="sticky top-0 z-40 no-print">
      {ws && <WsBar name={ws.name} />}
      {!ordering.open && (
        <div role="status" className="bg-accent text-white text-xs sm:text-sm font-bold">
          <div className="wrap flex items-center gap-2 min-h-9 py-1.5">
            <Icon n="clock" s={16} className="shrink-0" />
            <span className="leading-5">{en ? ordering.en : ordering.ar}</span>
          </div>
        </div>
      )}
      <header className="bg-white/95 backdrop-blur">
        <div className="wrap flex items-center gap-2 sm:gap-4 h-16 md:h-[76px]">
          <LogoTap>
            <img
              src={s["logo.url"] || "/brand/logo-wordmark.png"}
              alt={s["site.name"] || "DYLLU"}
              className="h-8 xs:h-9 md:h-11 w-auto max-w-[96px] xs:max-w-[150px] object-contain"
            />
          </LogoTap>
          <HeaderNav cats={cats} />
          <div className="hidden md:block flex-1 max-w-xl ms-auto">
            <SearchBox placeholder={ph} cur={cur} hidden={hidden} />
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 ms-auto md:ms-0">
            <InstallApp en={en} />
            <MobileSearch placeholder={ph} cur={cur} hidden={hidden} cats={cats} />
            <LangToggle />
            <CartButton />
          </div>
        </div>
        <div className="h-[3px] bg-lime shadow-[0_1px_0_theme(colors.accent)]" />
      </header>
    </div>
  );
}
