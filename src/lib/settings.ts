import { db } from "./db";
import { defaultSettings } from "@/config/brand";
export async function getSettings() {
  const rows = await db.setting.findMany();
  return { ...defaultSettings, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}
