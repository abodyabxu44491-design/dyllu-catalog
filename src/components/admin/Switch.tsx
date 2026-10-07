"use client";
// مفتاح تشغيل/إيقاف موحّد للوحة التحكم
export default function Switch({ on, onChange, label, hint, disabled, size = "md", ariaLabel }: { on: boolean; onChange: (v: boolean) => void; label?: string; hint?: string; disabled?: boolean; size?: "sm" | "md"; ariaLabel?: string }) {
  const w = size === "sm" ? "w-9 h-5" : "w-12 h-7", k = size === "sm" ? "w-4 h-4" : "w-6 h-6", tx = size === "sm" ? "translate-x-4 rtl:-translate-x-4" : "translate-x-5 rtl:-translate-x-5";
  const btn = <button type="button" role="switch" aria-checked={on} aria-label={label ?? ariaLabel} disabled={disabled} onClick={() => onChange(!on)} className={`${w} shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50 ${on ? "bg-ink" : "bg-line"}`}><span className={`block ${k} rounded-full shadow-sm transition-transform ${on ? `${tx} bg-lime` : "bg-white"}`} /></button>;
  if (!label) return btn;
  return <div className="flex items-center justify-between gap-3 py-1"><span className="min-w-0"><b className="block text-sm">{label}</b>{hint && <small className="block text-xs text-steel leading-5">{hint}</small>}</span>{btn}</div>;
}
