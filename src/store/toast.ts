import { create } from "zustand";
// إشعارات قصيرة أسفل الشاشة (إضافة للسلة، حفظ في لوحة التحكم...). action = رابط اختياري داخل الإشعار
export type Toast = { id: number; text: string; tone?: "ok" | "err"; action?: { label: string; href: string } };
let n = 0;
export const useToast = create<{ items: Toast[]; push: (t: Omit<Toast, "id">) => void; drop: (id: number) => void }>()((set, get) => ({
  items: [],
  push: (t) => { const id = ++n; set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] })); setTimeout(() => get().drop(id), t.tone === "err" ? 5000 : 3200); },
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));
export const toast = (text: string, o: Omit<Toast, "id" | "text"> = {}) => useToast.getState().push({ text, ...o });
