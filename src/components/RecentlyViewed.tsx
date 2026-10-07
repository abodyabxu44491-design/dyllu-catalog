"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useRecent } from "@/store/recent";
import { useLang } from "@/lib/useLang";
type Item = { id: number; slug: string; nameAr: string; nameEn: string; image: string | null; price: number | null };
// «شاهدتها مؤخرًا»: تسجّل المنتج الحالي (track) وتعرض آخر ما شاهده الزائر كصف أفقي
export default function RecentlyViewed({ track, exclude, cur, hidden }: { track?: number; exclude?: number; cur: string; hidden: string }) {
  const L = useLang(), en = L === "en", { ids, see } = useRecent(), [items, setItems] = useState<Item[]>([]);
  useEffect(() => { if (track) see(track); }, [track, see]);
  const key = ids.filter((i) => i !== exclude).slice(0, 10).join(",");
  useEffect(() => { if (!key) return setItems([]); fetch(`/api/products/by-ids?ids=${key}`).then((r) => r.json()).then((x: Item[]) => setItems(key.split(",").map(Number).map((id) => x.find((p) => p.id === id)).filter((p): p is Item => !!p))).catch(() => {}); }, [key]);
  if (items.length < 2) return null;
  return (<section className="space-y-4">
    <div className="flex items-center gap-2"><span className="w-9 h-9 rounded-xl bg-soft grid place-items-center text-steel"><Icon n="clock" s={18} /></span><h2 className="font-sans font-extrabold text-lg">{en ? "Recently viewed" : "شاهدتها مؤخرًا"}</h2></div>
    <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 flex gap-3 overflow-x-auto snap-x no-scrollbar pb-1">
      {items.map((p) => (<Link key={p.id} href={`/products/${p.slug}`} className="snap-start shrink-0 w-36 sm:w-44 card overflow-hidden hover:shadow-card transition">
        <span className="block aspect-square bg-soft">{p.image && <img src={p.image} alt="" loading="lazy" className="w-full h-full object-contain p-2" />}</span>
        <span className="block p-2.5"><b className="block text-xs sm:text-sm leading-snug line-clamp-2">{(en ? p.nameEn : p.nameAr) || p.nameAr || p.nameEn}</b><small className={`block mt-1 text-xs ${p.price == null ? "text-steel" : "font-bold"}`}>{p.price == null ? hidden : `${p.price} ${cur}`}</small></span></Link>))}
    </div></section>);
}
