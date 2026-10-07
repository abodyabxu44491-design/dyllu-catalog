import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type Line = { productId: number; quantity: number };
export const useCart = create<{ lines: Line[]; add: (id: number, q?: number) => void; setQty: (id: number, q: number) => void; clear: () => void }>()(persist((set) => ({
  lines: [],
  add: (id, q = 1) => set((s) => ({ lines: s.lines.some((l) => l.productId === id) ? s.lines.map((l) => (l.productId === id ? { ...l, quantity: Math.min(999, l.quantity + q) } : l)) : [...s.lines, { productId: id, quantity: q }] })),
  setQty: (id, q) => set((s) => ({ lines: q <= 0 ? s.lines.filter((l) => l.productId !== id) : s.lines.map((l) => (l.productId === id ? { ...l, quantity: Math.min(999, q) } : l)) })),
  clear: () => set({ lines: [] }),
}), { name: "dyllu-cart" }));
// عدد القطع في السلة بعد التحميل على المتصفح فقط (يطابق HTML السيرفر ويتجنب خطأ hydration)
export function useCartCount() {
  const lines = useCart((s) => s.lines), [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m ? lines.reduce((n, l) => n + l.quantity, 0) : 0;
}
