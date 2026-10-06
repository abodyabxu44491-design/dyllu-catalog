"use client";
import { useLang } from "@/lib/useLang";
export default function PrintButton() { const en = useLang() === "en"; return <button onClick={() => window.print()} className="border rounded-xl p-3 flex-1 font-bold print:hidden">{en ? "Save PDF / Print" : "حفظ PDF / طباعة"}</button>; }
