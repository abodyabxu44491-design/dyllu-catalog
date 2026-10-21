// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { getSettings } from "./settings";
// One switch in the admin pauses new orders; checked on the server, not only in the page
export async function orderingState() {
  const s = await getSettings();
  return {
    open: s["orders.enabled"] !== "0",
    ar: s["orders.pausedMsg.ar"] || "استقبال الطلبات متوقف مؤقتًا.",
    en: s["orders.pausedMsg.en"] || s["orders.pausedMsg.ar"] || "Ordering is temporarily paused.",
  };
}
