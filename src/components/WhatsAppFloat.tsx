"use client";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
// زر واتساب عائم: محادثة مباشرة مع الشركة من أي صفحة. يختفي في صفحة المنتج والسلة (لهما أزرار خاصة)
export default function WhatsAppFloat({ href }: { href: string }) {
  const p = usePathname(), en = useLang() === "en";
  if (/^\/(products\/[^/]+|cart)/.test(p)) return null;
  return (<a href={href} target="_blank" rel="noopener noreferrer" aria-label={en ? "Chat on WhatsApp" : "تواصل عبر واتساب"}
    className="group fixed z-30 end-4 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 md:end-6 flex items-center gap-2 rounded-full bg-[#1FA855] text-white shadow-lift ps-3.5 pe-3.5 h-14 hover:pe-5 transition-all no-print">
    <Icon n="whatsapp" s={26} /><span className="hidden md:group-hover:inline text-sm font-bold whitespace-nowrap">{en ? "Chat with us" : "تواصل معنا"}</span>
    <span className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-lime border-2 border-white" aria-hidden /></a>);
}
