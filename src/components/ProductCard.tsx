import Link from "next/link";
import AddToCart from "./AddToCart";
import { isWsPrice, priceLabel } from "@/lib/format";
import { getLang } from "@/lib/lang";
type P = { id: number; slug: string; nameAr: string; nameEn: string; price: unknown; wholesalePrice?: unknown; showPrice: boolean; allowCart: boolean; images: { url: string }[] };
export default function ProductCard({ p, s, ws = false }: { p: P; s: Record<string, string>; ws?: boolean }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white flex flex-col">
      <Link href={`/products/${p.slug}`}>
        <div className="aspect-square bg-soft relative">{isWsPrice(p, ws) && <span className="absolute top-2 start-2 bg-ink text-lime text-[11px] font-extrabold rounded-lg px-2 py-0.5">{getLang() === "en" ? "Wholesale" : "سعر جملة"}</span>}{p.images[0] && <img src={p.images[0].url} alt={p.nameEn} className="w-full h-full object-contain" />}</div>
        <div className="p-3"><div className="text-xs text-gray-500">DYLLU</div><div className="font-bold text-sm" dir="ltr">{p.nameEn}</div><div className="text-sm">{p.nameAr}</div></div>
      </Link>
      <div className="p-3 mt-auto"><div className="font-extrabold mb-2">{priceLabel(p, s, getLang(), ws)}</div>{p.allowCart && <AddToCart productId={p.id} />}</div>
    </div>
  );
}
