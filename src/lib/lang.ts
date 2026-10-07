import { cookies } from "next/headers";
import type { Lang } from "./i18n";
export { pick, t, txt, type Lang } from "./i18n";
export const getLang = (): Lang => (cookies().get("lang")?.value === "en" ? "en" : "ar");
