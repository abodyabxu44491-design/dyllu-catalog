"use client";
import { useRouter } from "next/navigation";
export default function LangToggle({ lang }: { lang: string }) {
  const r = useRouter();
  return <button className="text-steel text-sm border border-steel/30 rounded-full px-3 py-2 font-bold" onClick={() => { document.cookie = `lang=${lang === "en" ? "ar" : "en"}; path=/; max-age=31536000`; r.refresh(); }}>{lang === "en" ? "العربية" : "EN"}</button>;
}
