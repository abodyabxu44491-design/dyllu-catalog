export const STATUS_AR: Record<string, string> = { NEW: "جديد", CONTACTED: "تم التواصل", CONFIRMED: "مؤكد", COMPLETED: "مكتمل", CANCELLED: "ملغي" };
export const STATUS_CLS: Record<string, string> = { NEW: "bg-accent text-white", CONTACTED: "bg-ink text-white", CONFIRMED: "bg-lime text-ink", COMPLETED: "bg-ink/10 text-ink", CANCELLED: "bg-ink/10 text-steel line-through" };
export const money = (n: unknown) => Number(n ?? 0).toLocaleString("en-US");
export const fmtDate = (d: Date) => d.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
