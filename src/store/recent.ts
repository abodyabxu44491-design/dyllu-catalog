import { create } from "zustand";
import { persist } from "zustand/middleware";
// آخر المنتجات التي شاهدها الزائر (على جهازه فقط، بحد أقصى 12)
export const useRecent = create<{ ids: number[]; see: (id: number) => void }>()(persist((set) => ({
  ids: [], see: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })),
}), { name: "dyllu-recent" }));
