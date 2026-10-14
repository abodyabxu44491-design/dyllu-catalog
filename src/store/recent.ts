// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useRecent = create<{ ids: number[]; see: (id: number) => void }>()(
  persist(
    (set) => ({
      ids: [],
      see: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })),
    }),
    { name: "dyllu-recent" },
  ),
);
