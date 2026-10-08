// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
export function PageHead({
  title,
  desc,
  children,
  back,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
  back?: [string, string];
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 md:mb-7">
      <div className="min-w-0 space-y-2">
        {back && (
          <Link href={back[0]} className="inline-flex items-center gap-1 text-sm font-bold text-steel hover:text-ink">
            <Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />
            {back[1]}
          </Link>
        )}
        <h1 className="dy-tab">{title}</h1>
        {desc && <p className="text-sm text-steel max-w-2xl leading-6">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
export function Card({
  title,
  desc,
  action,
  children,
  className = "",
  pad = true,
}: {
  title?: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-line ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 md:px-5 pt-4 md:pt-5">
          <div>
            {title && <h2 className="font-sans font-extrabold text-base">{title}</h2>}
            {desc && <p className="text-xs text-steel mt-0.5 leading-5">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? "p-4 md:p-5" : ""}>{children}</div>
    </section>
  );
}
export function Stat({
  label,
  value,
  sub,
  icon,
  href,
  tone = "lime",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: IconName;
  href?: string;
  tone?: "lime" | "accent" | "ink" | "soft";
}) {
  const ic = { lime: "bg-lime text-ink", accent: "bg-accent text-white", ink: "bg-ink text-lime", soft: "bg-soft text-steel" }[tone];
  const c = (
    <div className="h-full bg-white rounded-2xl border border-line p-4 flex items-start gap-3 transition hover:shadow-card">
      <span className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${ic}`}>
        <Icon n={icon} s={22} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-bold text-steel">{label}</div>
        <div className="font-display text-2xl leading-tight mt-0.5 truncate">{value}</div>
        {sub && <div className="text-xs text-steel mt-0.5">{sub}</div>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {c}
    </Link>
  ) : (
    c
  );
}
export const Badge = ({ children, cls = "bg-soft text-steel" }: { children: React.ReactNode; cls?: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap ${cls}`}>
    {children}
  </span>
);
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block text-sm font-bold">{label}</span>
      {children}
      {hint && <small className="block text-xs text-steel leading-5">{hint}</small>}
    </label>
  );
}
export function AEmpty({ icon, title, children }: { icon: IconName; title: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-4">
      <span className="mx-auto mb-3 grid place-items-center w-16 h-16 rounded-full bg-soft text-steel">
        <Icon n={icon} s={28} stroke={1.6} />
      </span>
      <b className="block">{title}</b>
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </div>
  );
}
export function APager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex gap-2 justify-center items-center pt-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-sm btn-ghost">
          <Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />
          السابق
        </Link>
      ) : (
        <span className="btn btn-sm btn-ghost opacity-40">السابق</span>
      )}
      <span className="text-sm font-bold text-steel px-2">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-sm btn-ghost">
          التالي
          <Icon n="chev" s={16} className="rtl:rotate-180" />
        </Link>
      ) : (
        <span className="btn btn-sm btn-ghost opacity-40">التالي</span>
      )}
    </div>
  );
}
