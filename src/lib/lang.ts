// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cookies } from "next/headers";
import type { Lang } from "./i18n";
export { pick, t, txt, type Lang } from "./i18n";
export const getLang = async (): Promise<Lang> => ((await cookies()).get("lang")?.value === "en" ? "en" : "ar");
