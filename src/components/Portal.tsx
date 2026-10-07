"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
// يعرض النوافذ المنبثقة على مستوى body: عنصر أب فيه backdrop-filter/transform (مثل الهيدر) يحبس عناصر fixed داخله
export default function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  return el ? createPortal(children, el) : null;
}
