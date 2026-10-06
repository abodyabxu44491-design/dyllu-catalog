"use client";
import { useEffect, useState } from "react";
// لغة الواجهة في المكونات التفاعلية (الكوكي lang يضبطه زر اللغة)
export function useLang() { const [l, setL] = useState("ar"); useEffect(() => setL(document.cookie.includes("lang=en") ? "en" : "ar"), []); return l; }
