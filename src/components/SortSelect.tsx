"use client";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "./Icon";
// قائمة الترتيب: كل خيار رابط جاهز من السيرفر، والاختيار ينتقل مباشرة
export default function SortSelect({ label, value, options, icon = "sort" }: { label: string; value: string; options: { v: string; label: string; href: string }[]; icon?: IconName }) {
  const r = useRouter();
  return (<label className="relative inline-flex items-center">
    <span className="sr-only">{label}</span><Icon n={icon} s={16} className="absolute start-3 text-steel pointer-events-none" />
    <select value={value} onChange={(e) => r.push(options.find((o) => o.v === e.target.value)!.href, { scroll: false })} className="field h-10 ps-9 text-sm font-bold w-auto rounded-full">
      {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select></label>);
}
