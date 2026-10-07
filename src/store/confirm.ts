import { create } from "zustand";
// نافذة تأكيد بتصميم الموقع بدل confirm() الخاصة بالمتصفح: if (!(await ask({ title: "حذف؟" }))) return;
export type Ask = { title: string; body?: string; ok?: string; cancel?: string; danger?: boolean };
type S = { q: (Ask & { done: (v: boolean) => void }) | null };
export const useConfirm = create<S>()(() => ({ q: null }));
export const ask = (a: Ask) => new Promise<boolean>((done) => { useConfirm.getState().q?.done(false); useConfirm.setState({ q: { ...a, done } }); });
export const answer = (v: boolean) => { const q = useConfirm.getState().q; useConfirm.setState({ q: null }); q?.done(v); };
