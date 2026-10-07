"use client";
import { createContext, useContext } from "react";
import type { Lang } from "./lang";
// لغة الواجهة في المكونات التفاعلية: تأتي من السيرفر عبر Providers في layout، فلا يوجد وميض بين العربية والإنجليزية
export const LangContext = createContext<Lang>("ar");
export const useLang = () => useContext(LangContext);
