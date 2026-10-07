import { cache } from "react";
import { db } from "./db";
import { defaultSettings } from "@/config/brand";
// cache: استعلام واحد لكل طلب مهما استُدعيت (الإطار، الهيدر، التذييل، الصفحة)
export const getSettings = cache(async () => {
  const rows = await db.setting.findMany();
  return { ...defaultSettings, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
});
