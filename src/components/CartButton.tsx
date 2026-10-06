"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useCart } from "@/store/cart";
// زر السلة الثابت في الهيدر: يفتح صفحة السلة الكاملة /cart (عدّاد الكمية فوقه)
export default function CartButton({ lang }: { lang: string; ws?: boolean }) {
  const lines = useCart((s) => s.lines), [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const count = m ? lines.reduce((n, l) => n + l.quantity, 0) : 0;
  return (<Link href="/cart" aria-label={lang === "en" ? "Cart" : "السلة"} className="relative w-11 h-11 rounded-2xl bg-lime text-ink grid place-items-center"><Icon n="cart" s={22} />
    {count > 0 && <span className="absolute -top-2 -end-2 min-w-[21px] h-[21px] rounded-full bg-accent text-white text-xs font-extrabold grid place-items-center border-2 border-white px-1">{count}</span>}</Link>);
}
