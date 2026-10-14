// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { db } from "./db";
import { defaultSettings } from "@/config/brand";
export const getSettings = cache(async () => {
  const rows = await db.setting.findMany();
  return { ...defaultSettings, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
});
