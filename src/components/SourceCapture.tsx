"use client";
import { useEffect } from "react";
// يحفظ مصدر الـ QR (?src=riyadh) لإرفاقه بالطلب لاحقًا
export default function SourceCapture() { useEffect(() => { const s = new URLSearchParams(location.search).get("src"); if (s) localStorage.setItem("dyllu-src", s); }, []); return null; }
