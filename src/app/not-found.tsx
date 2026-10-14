// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center bg-soft">
      <div>
        <b className="block font-display text-8xl text-lime [-webkit-text-stroke:2px_theme(colors.steel)]">404</b>
        <h1 className="text-2xl mt-4">الصفحة غير موجودة · Page not found</h1>
        <Link href="/" className="btn btn-lg btn-lime mt-8">
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
