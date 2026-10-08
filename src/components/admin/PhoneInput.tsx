// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { isPhone, localPhone, prettyPhone, telHref, waHref } from "@/lib/phone";
export default function PhoneInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(() => (/x/i.test(value) ? "" : localPhone(value)));
  const ok = isPhone(text),
    shown = !!text;
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-bold">{label}</span>
      <span className="relative block">
        <Icon n="phone" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
        <input
          className={`field ps-10 ${shown && !ok ? "border-accent" : ""}`}
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05XXXXXXXX"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value);
          }}
        />
      </span>
      {shown ? (
        ok ? (
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-[#586000]">
              <Icon n="check" s={14} stroke={3} />
              <span dir="ltr">{prettyPhone(text)}</span>
            </span>
            <a
              href={waHref(text)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-soft px-2 py-1 font-bold hover:bg-line"
            >
              <Icon n="whatsapp" s={14} className="text-[#1FA855]" />
              جرّب واتساب
            </a>
            <a href={telHref(text)} className="inline-flex items-center gap-1 rounded-lg bg-soft px-2 py-1 font-bold hover:bg-line">
              <Icon n="phone" s={14} />
              اتصال
            </a>
          </span>
        ) : (
          <small className="flex items-center gap-1 text-xs font-bold text-accent">
            <Icon n="alert" s={14} />
            الرقم غير مكتمل، تحقق منه
          </small>
        )
      ) : (
        hint && <small className="block text-xs text-steel leading-5">{hint}</small>
      )}
    </label>
  );
}
