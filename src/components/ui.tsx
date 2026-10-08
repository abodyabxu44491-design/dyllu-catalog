// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import Icon, { type IconName } from "./Icon";
export function SectionHead({
  title,
  href,
  more,
  as: H = "h2",
  className = "",
}: {
  title: string;
  href?: string;
  more?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <H className="dy-tab">{title}</H>
      {href && more && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-bold text-steel hover:text-ink">
          {more}
          <Icon n="chev" s={16} className="flip-rtl transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
export function Empty({
  icon = "box",
  title,
  sub,
  children,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6">
      <span className="mx-auto mb-4 grid place-items-center w-20 h-20 rounded-full bg-soft text-steel">
        <Icon n={icon} s={36} stroke={1.6} />
      </span>
      <b className="block text-lg">{title}</b>
      {sub && <p className="text-steel mt-1">{sub}</p>}
      {children && <div className="mt-5 flex flex-wrap gap-2 justify-center">{children}</div>}
    </div>
  );
}
export function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm text-steel flex-wrap">
      {items.map(([label, href], i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <Icon n="chev" s={14} className="flip-rtl opacity-50" />}
          {href ? (
            <Link href={href} className="hover:text-ink">
              {label}
            </Link>
          ) : (
            <span className="text-ink font-bold line-clamp-1">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
