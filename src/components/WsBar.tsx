"use client";
import { useRouter } from "next/navigation";
// شريط يظهر فقط لعميل الجملة بعد دخوله
export default function WsBar({ name }: { name: string }) {
  const r = useRouter();
  return (<div className="bg-ink text-lime flex justify-between items-center px-4 py-2 text-sm font-bold"><span>حساب جملة: {name}</span>
    <button className="border border-lime rounded-lg px-3 py-0.5" onClick={async () => { await fetch("/api/ws", { method: "DELETE" }); r.refresh(); }}>خروج</button></div>);
}
