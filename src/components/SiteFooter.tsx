// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import { getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getLang, pick, t, txt } from "@/lib/lang";
import { isPhone, prettyPhone, telHref, waHref } from "@/lib/phone";
import Icon, { type IconName } from "./Icon";
const SOCIAL: [string, string, (h: string) => string][] = [
  ["social.instagram", "Instagram", (h) => `https://instagram.com/${h}`],
  ["social.x", "X", (h) => `https://x.com/${h}`],
  ["social.tiktok", "TikTok", (h) => `https://tiktok.com/@${h}`],
  ["social.snapchat", "Snapchat", (h) => `https://snapchat.com/add/${h}`],
];
const url = (v: string, f: (h: string) => string) => (/^https?:\/\//.test(v) ? v : f(v.replace(/^@/, "")));
export default async function SiteFooter() {
  const [s, cats] = await Promise.all([getSettings(), getNavCategories().then((c) => c.slice(0, 8))]);
  const L = getLang(),
    name = s["site.name"] || "DYLLU",
    wa = s["whatsapp.number"],
    hasWa = isPhone(wa),
    call = isPhone(s["contact.phone"]) ? s["contact.phone"] : hasWa ? wa : "";
  const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <b className="block text-white font-display mb-4">{title}</b>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
  const Item = ({ href, icon, children, ext }: { href: string; icon?: IconName; children: React.ReactNode; ext?: boolean }) => (
    <li>
      <a
        href={href}
        {...(ext && { target: "_blank", rel: "noopener noreferrer" })}
        className="inline-flex items-center gap-2 text-white/70 hover:text-lime transition"
      >
        {icon && <Icon n={icon} s={16} />}
        {children}
      </a>
    </li>
  );
  const socials = SOCIAL.filter(([k]) => s[k]);
  return (
    <footer className="mt-16 no-print">
      <div className="bg-ink text-white">
        <div className="wrap py-10 md:py-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <span className="inline-block bg-white rounded-2xl p-2.5">
              <img src="/brand/logo-badge.png" alt={name} className="h-16 w-auto" />
            </span>
            <p className="text-white/70 text-sm leading-7 max-w-xs">{txt(s, L, "footer.text")}</p>
            {socials.length > 0 && (
              <div className="flex gap-2">
                {socials.map(([k, label, f]) => (
                  <a
                    key={k}
                    href={url(s[k], f)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-white/10 text-white hover:bg-lime hover:text-ink"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <Col title={t(L, "quickLinks")}>
            <Item href="/">{t(L, "home")}</Item>
            <Item href="/products">{t(L, "all")}</Item>
            <Item href="/products?featured=1">{txt(s, L, "home.featured")}</Item>
            <Item href="/categories">{t(L, "categories")}</Item>
            <Item href="/cart">{t(L, "cart")}</Item>
          </Col>
          {cats.length > 0 && (
            <Col title={t(L, "categories")}>
              {cats.map((c) => (
                <Item key={c.slug} href={`/categories/${c.slug}`}>
                  {pick(L, c.nameAr, c.nameEn)}
                </Item>
              ))}
            </Col>
          )}
          {(hasWa || call || s["contact.email"] || txt(s, L, "contact.address")) && (
            <div className="col-span-2 sm:col-span-1">
              <Col title={t(L, "contact")}>
                {hasWa && (
                  <Item href={waHref(wa)} icon="whatsapp" ext>
                    {L === "en" ? "WhatsApp" : "واتساب"} · <span dir="ltr">{prettyPhone(wa)}</span>
                  </Item>
                )}
                {call && (
                  <Item href={telHref(call)} icon="phone">
                    {L === "en" ? "Call" : "اتصال"} · <span dir="ltr">{prettyPhone(call)}</span>
                  </Item>
                )}
                {s["contact.email"] && (
                  <Item href={`mailto:${s["contact.email"]}`} icon="mail">
                    {s["contact.email"]}
                  </Item>
                )}
                {txt(s, L, "contact.address") && (
                  <li className="flex items-start gap-2 text-white/70 text-sm">
                    <Icon n="pin" s={16} className="mt-0.5" />
                    {txt(s, L, "contact.address")}
                  </li>
                )}
              </Col>
            </div>
          )}
        </div>
        <div className="border-t border-white/10">
          <div className="wrap py-4 text-xs text-white/50 flex flex-wrap justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {name}. {t(L, "rights")}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-lime shadow-[0_-3px_0_theme(colors.accent)]">
        <div className="wrap h-9 flex items-center justify-end">
          <b className="text-steel text-xs sm:text-sm tracking-wide" dir="ltr">
            {txt(s, L, "footer.tagline") || "DYLLU, Discover your Power"}
          </b>
        </div>
      </div>
    </footer>
  );
}
