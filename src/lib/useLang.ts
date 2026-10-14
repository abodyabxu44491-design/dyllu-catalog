// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { createContext, useContext } from "react";
import type { Lang } from "./lang";
export const LangContext = createContext<Lang>("ar");
export const useLang = () => useContext(LangContext);
