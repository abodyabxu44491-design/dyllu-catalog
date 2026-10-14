// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect } from "react";
export default function SourceCapture() {
  useEffect(() => {
    const u = new URL(location.href),
      s = u.searchParams.get("src"),
      rep = u.searchParams.get("rep");
    if (rep && /^\d{1,9}$/.test(rep)) {
      try {
        localStorage.setItem("dyllu-rep", rep);
      } catch {}
      u.searchParams.delete("rep");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    }
    if (!s) return;
    try {
      localStorage.setItem("dyllu-src", s);
    } catch {}
    try {
      if (sessionStorage.getItem("dyllu-scan") !== s) {
        sessionStorage.setItem("dyllu-scan", s);
        fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ src: s }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
    u.searchParams.delete("src");
    history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  }, []);
  return null;
}
