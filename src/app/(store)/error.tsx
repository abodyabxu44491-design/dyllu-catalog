"use client";
import Icon from "@/components/Icon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  const L = useLang();
  return (<div className="wrap py-20 text-center">
    <span className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-accent/10 text-accent"><Icon n="alert" s={36} /></span>
    <h1 className="text-2xl mt-5">{t(L, "error")}</h1><p className="text-steel mt-2">{t(L, "errorSub")}</p>
    <button onClick={reset} className="btn btn-lg btn-lime mt-8">{t(L, "retry")}</button></div>);
}
