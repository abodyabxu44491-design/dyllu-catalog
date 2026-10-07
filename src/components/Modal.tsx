"use client";
import { useEffect, useId, useRef } from "react";
import Icon, { type IconName } from "./Icon";
import Portal from "./Portal";
// نافذة موحّدة لكل الموقع: في منتصف الشاشة على كل الأجهزة، زر إغلاق، Esc، الضغط خارجها يغلقها، وتمنع تمرير الصفحة خلفها
const W = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
export default function Modal({ open, onClose, title, sub, icon, size = "sm", closeLabel = "إغلاق", children }: {
  open: boolean; onClose: () => void; title: React.ReactNode; sub?: React.ReactNode; icon?: IconName; size?: keyof typeof W; closeLabel?: string; children: React.ReactNode;
}) {
  const id = useId(), box = useRef<HTMLDivElement>(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null, k = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    addEventListener("keydown", k); document.documentElement.style.overflow = "hidden";
    // التركيز داخل النافذة (حقل autoFocus إن وُجد، وإلا النافذة نفسها) لقارئ الشاشة ولوحة المفاتيح
    requestAnimationFrame(() => { const b = box.current; if (b && !b.contains(document.activeElement)) b.focus({ preventScroll: true }); });
    return () => { removeEventListener("keydown", k); document.documentElement.style.overflow = ""; prev?.focus?.({ preventScroll: true }); };
  }, [open]);
  if (!open) return null;
  return (<Portal>
    <div className="dy-modal fixed inset-0 z-[90] grid place-items-center p-4 sm:p-6 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dy-modal-bg fixed inset-0 bg-ink/55 backdrop-blur-[6px] -z-10" aria-hidden onMouseDown={onClose} />
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={`dy-modal-box relative w-full ${W[size]} bg-white rounded-[1.75rem] shadow-[0_30px_80px_-20px_rgba(43,45,47,.55)] overflow-hidden outline-none my-auto`}>
        <div className="dy-stripe" />
        <header className="flex items-start gap-3 px-5 pt-5 pb-1">
          {icon && <span className="w-11 h-11 rounded-2xl bg-lime text-ink grid place-items-center shrink-0"><Icon n={icon} s={22} /></span>}
          <div className="flex-1 min-w-0 pt-0.5"><h2 id={id} className="text-lg leading-snug">{title}</h2>{sub && <p className="text-sm text-steel leading-6 mt-0.5">{sub}</p>}</div>
          <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel} className="btn-icon w-10 h-10 -me-1.5 -mt-1 rounded-full bg-soft text-steel hover:bg-line hover:text-ink shrink-0"><Icon n="close" s={18} stroke={2.6} /></button>
        </header>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </div>
    </div>
  </Portal>);
}
