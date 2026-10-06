"use client";
import Icon from "./Icon";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useLang } from "@/lib/useLang";
export default function AddToCart({ productId, withQty = false }: { productId: number; withQty?: boolean }) {
  const en = useLang() === "en", add = useCart((s) => s.add);
  const [q, setQ] = useState(1), [done, setDone] = useState(false);
  const click = () => { add(productId, q); setDone(true); setTimeout(() => setDone(false), 1200); };
  return (
    <div className="flex items-center gap-2">
      {withQty && (<div className="flex items-center border rounded-xl"><button aria-label="-" className="px-3 py-3" onClick={() => setQ(Math.max(1, q - 1))}><Icon n="minus" s={16} /></button><span className="w-8 text-center">{q}</span><button aria-label="+" className="px-3 py-3" onClick={() => setQ(q + 1)}><Icon n="plus" s={16} /></button></div>)}
      <button onClick={click} className="bg-lime text-ink font-extrabold rounded-xl px-4 py-3 flex-1">{done ? <span className="inline-flex items-center justify-center gap-1.5"><Icon n="check" s={18} />{en ? "Added" : "تمت الإضافة"}</span> : withQty ? (en ? "Add to cart" : "إضافة إلى السلة") : <Icon n="plus" s={18} />}</button>
    </div>
  );
}
