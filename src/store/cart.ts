import { create } from "zustand";
import { persist } from "zustand/middleware";
type Line = { productId: number; quantity: number };
export const useCart = create<{ lines: Line[]; add: (id: number, q?: number) => void; setQty: (id: number, q: number) => void; clear: () => void }>()(persist((set) => ({
  lines: [],
  add: (id, q = 1) => set((s) => ({ lines: s.lines.some((l) => l.productId === id) ? s.lines.map((l) => (l.productId === id ? { ...l, quantity: l.quantity + q } : l)) : [...s.lines, { productId: id, quantity: q }] })),
  setQty: (id, q) => set((s) => ({ lines: q <= 0 ? s.lines.filter((l) => l.productId !== id) : s.lines.map((l) => (l.productId === id ? { ...l, quantity: q } : l)) })),
  clear: () => set({ lines: [] }),
}), { name: "dyllu-cart" }));
