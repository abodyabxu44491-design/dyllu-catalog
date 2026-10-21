// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import Modal from "@/components/Modal";
import { toast } from "@/store/toast";
import { Badge, Card, PageHead } from "./ui";

type Mode = "full" | "stock";
type Col = [head: string, key: string, re: RegExp, sample: string, sample2: string];
const FULL: Col[] = [
  ["كود المنتج *", "sku", /^(?!.*(بار|bar)).*(كود|موديل|sku|code|model)/i, "DTAW1110", "DTAW1112"],
  ["اسم المنتج", "name", /اسم|name/i, "مفتاح إنجليزي 10 إنش", "مفتاح إنجليزي 12 إنش"],
  ["التصنيفات (افصل بينها بـ |)", "categories", /تصنيف|قسم|categor/i, "العدد اليدوية", "العدد اليدوية | المفاتيح"],
  ["السعر", "price", /^(?!.*جمل).*سعر|^price/i, "45", "55"],
  ["سعر الجملة", "wholesale", /جمل|wholesale/i, "38", "46"],
  ["الكمية", "stock", /كمي|stock|qty|quantity/i, "120", "0"],
  ["الباركود", "barcode", /باركود|barcode|ean|upc/i, "6291234567890", ""],
  ["الوصف", "description", /وصف|description/i, "مفتاح من فولاذ C45 بفك قابل للضبط حتى 30 ملم", ""],
  ["المميزات (افصل بينها بـ |)", "features", /ميزات|^features?$/i, "فولاذ عالي التحمل | فك دقيق الضبط", ""],
  ["المواصفات (الاسم: القيمة | ...)", "specs", /مواصف|spec/i, "الطول: 250 ملم | فتحة الفك: 0-30 ملم", ""],
  ["رابط الصورة", "image", /صور|image|photo/i, "", ""],
  ["ظاهر (نعم/لا)", "isActive", /ظاهر|active|visible/i, "نعم", "نعم"],
  ["مميز (نعم/لا)", "isFeatured", /مميز(?!ات)|featured/i, "لا", "لا"],
];
const STOCK: Col[] = [
  ["كود المنتج *", "sku", FULL[0][2], "DTAW1110", "DTAW1112"],
  ["الكمية *", "stock", FULL[5][2], "120", "0"],
];
type Raw = { row: number; [k: string]: string | number };
type Result = {
  row: number;
  sku: string;
  name: string;
  action: "create" | "update" | "same" | "error";
  errors: string[];
  changes: [string, string, string][];
  becomesOut: boolean;
  needsPrep: boolean;
};
type Summary = { create: number; update: number; same: number; errors: number; duplicates: number; out: number };
type Analysis = { results: Result[]; summary: Summary; newCategories: string[] };
type Done = { created: number; updated: number; rejected: number; same: number; imageErrors: { row: number; error: string }[] };
type Log = {
  id: number;
  kind: string;
  fileName: string;
  adminName: string;
  created: number;
  updated: number;
  rejected: number;
  undoneAt: string | null;
  undoneBy: string | null;
  createdAt: string;
};
type Plan = {
  restore: number;
  remove: number;
  hide: number;
  conflicts: { id: number; sku: string | null; name: string }[];
  fileName: string;
};

const str = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [],
    cell = "",
    q = false;
  const first = text.split("\n")[0];
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    out.push(row);
  }
  return out.filter((r) => r.some((c) => c.trim()));
}
async function api<T>(body: object): Promise<T> {
  const res = await fetch("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "تعذر الاتصال، حاول مرة أخرى");
  return d as T;
}
const ACTION: Record<Result["action"], [string, string]> = {
  create: ["جديد", "bg-lime text-ink"],
  update: ["تحديث", "bg-ink text-lime"],
  same: ["بدون تغيير", "bg-soft text-steel"],
  error: ["مرفوض", "bg-red-50 text-red-700"],
};
const fmt = (d: string) =>
  new Date(d).toLocaleString("ar-SA-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ImportManager() {
  const r = useRouter(),
    input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("full"),
    [file, setFile] = useState(""),
    [rows, setRows] = useState<Raw[]>([]),
    [drag, setDrag] = useState(false),
    [missing, setMissing] = useState<string[]>([]);
  const [an, setAn] = useState<Analysis | null>(null),
    [newCats, setNewCats] = useState(false),
    [filter, setFilter] = useState<"all" | Result["action"] | "out">("all"),
    [busy, setBusy] = useState(""),
    [progress, setProgress] = useState(0),
    [done, setDone] = useState<Done | null>(null);
  const [logs, setLogs] = useState<Log[]>([]),
    [plan, setPlan] = useState<(Plan & { id: number }) | null>(null);
  const cols = mode === "full" ? FULL : STOCK;

  const loadLogs = () =>
    fetch("/api/admin/import")
      .then((x) => (x.ok ? x.json() : []))
      .then(setLogs)
      .catch(() => {});
  useEffect(() => {
    loadLogs();
  }, []);

  function reset(m: Mode = mode) {
    setMode(m);
    setFile("");
    setRows([]);
    setAn(null);
    setDone(null);
    setMissing([]);
    setNewCats(false);
    setFilter("all");
    if (input.current) input.current.value = "";
  }

  async function template(m: Mode) {
    const c = m === "full" ? FULL : STOCK;
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const head = c.map(([h]) => ({ value: h, fontWeight: "bold" as const, backgroundColor: "#D0DF00", color: "#2B2D2F" }));
    await writeExcelFile([head, c.map((x) => ({ value: x[3] })), c.map((x) => ({ value: x[4] }))], {
      rightToLeft: true,
      columns: c.map(([, k]) => ({
        width: ["description", "specs", "features"].includes(k) ? 42 : k === "name" || k === "categories" ? 30 : 18,
      })),
      stickyRowsCount: 1,
    } as never).toFile(m === "full" ? "DYLLU-products-template.xlsx" : "DYLLU-stock-template.xlsx");
  }

  async function analyze(list: Raw[], create: boolean) {
    setBusy("analyze");
    try {
      setAn(await api<Analysis>({ action: "analyze", mode, rows: list, createCategories: create }));
    } catch (e) {
      toast((e as Error).message, { tone: "err" });
    }
    setBusy("");
  }

  async function read(f: File) {
    reset(mode);
    setFile(f.name);
    try {
      let grid: unknown[][];
      if (/\.csv$/i.test(f.name) || f.type === "text/csv") grid = parseCsv((await f.text()).replace(/^﻿/, ""));
      else {
        const { readSheet } = await import("read-excel-file/universal");
        grid = (await readSheet(f)) as unknown[][];
      }
      if (grid.length < 2) return toast("الملف فارغ أو بدون صفوف", { tone: "err" });
      const head = grid[0].map(str),
        idx: Record<string, number> = {};
      for (const [, k, re] of cols) {
        const i = head.findIndex((h, j) => re.test(h) && !Object.values(idx).includes(j));
        if (i >= 0) idx[k] = i;
      }
      const need = cols.filter((c) => c[0].endsWith("*") && idx[c[1]] == null).map((c) => c[0].replace(" *", ""));
      setMissing(need);
      if (need.length) return;
      const list = grid
        .slice(1)
        .map((g, n) => {
          const o: Raw = { row: n + 2 };
          for (const [k, i] of Object.entries(idx)) {
            const v = str(g[i]);
            if (v) o[k] = v.slice(0, 5000);
          }
          return o;
        })
        .filter((o) => Object.keys(o).length > 1);
      if (!list.length) return toast("لم أجد صفوفًا في الملف", { tone: "err" });
      if (list.length > 5000) return toast("الحد الأقصى 5000 صف في الملف الواحد", { tone: "err" });
      setRows(list);
      await analyze(list, false);
    } catch {
      toast("تعذرت قراءة الملف. استخدم القالب بصيغة xlsx أو csv", { tone: "err" });
    }
  }

  async function errorReport() {
    if (!an) return;
    const bad = an.results.filter((x) => x.action === "error");
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const h = ["رقم الصف", "كود المنتج", "اسم المنتج", "سبب الرفض"].map((value) => ({
      value,
      fontWeight: "bold" as const,
      backgroundColor: "#D0DF00",
      color: "#2B2D2F",
    }));
    await writeExcelFile([h, ...bad.map((x) => [{ value: x.row }, { value: x.sku }, { value: x.name }, { value: x.errors.join(" • ") }])], {
      rightToLeft: true,
      columns: [{ width: 10 }, { width: 18 }, { width: 32 }, { width: 60 }],
      stickyRowsCount: 1,
    } as never).toFile(`DYLLU-import-errors-${file.replace(/\.[^.]+$/, "") || "file"}.xlsx`);
  }

  async function confirm() {
    if (!an) return;
    setBusy("commit");
    setProgress(0);
    try {
      // Translations and image downloads run first in small batches, then everything is saved in one step
      const todo = new Set(an.results.filter((x) => x.needsPrep && x.action !== "error").map((x) => x.row));
      const prepRows = mode === "full" ? rows.filter((x) => todo.has(x.row)) : [];
      const prepared: unknown[] = [];
      for (let i = 0; i < prepRows.length; i += 10) {
        const d = await api<{ prepared: unknown[] }>({ action: "prepare", rows: prepRows.slice(i, i + 10) });
        prepared.push(...d.prepared);
        setProgress(Math.round(((i + 10) / prepRows.length) * 90));
      }
      setProgress(95);
      const res = await api<Done>({ action: "commit", mode, rows, createCategories: newCats, fileName: file, prepared });
      setProgress(100);
      setDone(res);
      toast(`تم الحفظ: ${res.created} جديد و ${res.updated} تحديث`, { tone: "ok" });
      r.refresh();
      loadLogs();
    } catch (e) {
      toast(`${(e as Error).message}. لم يُحفظ أي تغيير`, { tone: "err" });
    }
    setBusy("");
  }

  async function openUndo(id: number) {
    try {
      setPlan({ id, ...(await api<Plan>({ action: "undoPlan", id })) });
    } catch (e) {
      toast((e as Error).message, { tone: "err" });
    }
  }
  async function doUndo() {
    if (!plan) return;
    setBusy("undo");
    try {
      await api({ action: "undo", id: plan.id });
      toast("تم التراجع عن الاستيراد وإرجاع القيم السابقة", { tone: "ok" });
      setPlan(null);
      r.refresh();
      loadLogs();
    } catch (e) {
      toast((e as Error).message, { tone: "err" });
    }
    setBusy("");
  }

  const s = an?.summary,
    pending = an?.newCategories.length && !newCats,
    canSave = !!an && !busy && !done && s!.create + s!.update > 0 && !pending;
  const shown = (an?.results ?? []).filter((x) =>
    filter === "all" ? true : filter === "out" ? x.becomesOut && x.action !== "error" : x.action === filter,
  );
  const latestOpen = logs.find((l) => !l.undoneAt)?.id;

  return (
    <div className="max-w-5xl space-y-4 md:space-y-5">
      <PageHead
        title="تحديث المنتجات من Excel"
        desc="كود المنتج هو المرجع: كود موجود يُحدَّث، وكود جديد يُضاف. المنتجات غير الموجودة في الملف لا تُحذف ولا تتغير."
        back={["/admin/products", "المنتجات"]}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        {(
          [
            ["full", "box", "إضافة وتحديث المنتجات", "أضف منتجات جديدة أو حدّث الأسعار والتصنيفات والكميات والبيانات"],
            ["stock", "chart", "تحديث المخزون فقط", "ملف بعمودين: كود المنتج والكمية. لا يغيّر أي بيانات أخرى"],
          ] as [Mode, IconName, string, string][]
        ).map(([m, ic, t, d]) => (
          <button
            key={m}
            type="button"
            onClick={() => reset(m)}
            disabled={!!busy}
            aria-pressed={mode === m}
            className={`text-start rounded-2xl border-2 p-4 flex gap-3 transition ${mode === m ? "border-ink bg-white shadow-card" : "border-line bg-white/60 hover:border-steel"}`}
          >
            <span
              className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${mode === m ? "bg-lime text-ink" : "bg-soft text-steel"}`}
            >
              <Icon n={ic} s={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold">{t}</span>
              <span className="block text-xs text-steel leading-5 mt-0.5">{d}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          title="1. نزّل القالب الرسمي واملأه"
          desc={mode === "full" ? "كود المنتج إلزامي في كل صف." : "كود المنتج والكمية إلزاميان في كل صف."}
        >
          <ul className="text-sm text-steel space-y-1.5 leading-6 mb-4">
            {(mode === "full"
              ? [
                  "الخانة الفارغة لا تمسح القيمة الحالية",
                  "المنتج الجديد يحتاج الاسم والتصنيف",
                  "أول تصنيف هو الرئيسي، والباقي يظهر فيها المنتج أيضًا",
                  "الكمية 0 = غير متوفر حاليًا، وأكبر من 0 = متوفر",
                ]
              : [
                  "الكمية رقم صحيح ولا تكون بالسالب",
                  "الكمية 0 = غير متوفر حاليًا ويُمنع طلبه",
                  "الكود غير الموجود في المنتجات يُرفض",
                  "الكمية لا تظهر للعملاء أبدًا",
                ]
            ).map((t) => (
              <li key={t} className="flex gap-2">
                <Icon n="check" s={16} className="text-ink mt-1 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => template(mode)} className="btn btn-md btn-dark w-full sm:w-auto">
            <Icon n="download" s={18} />
            {mode === "full" ? "قالب المنتجات (Excel)" : "قالب المخزون (Excel)"}
          </button>
        </Card>
        <Card title="2. ارفع الملف" desc="xlsx أو csv، حتى 5000 صف. ستظهر معاينة قبل أي حفظ.">
          <label
            onDragOver={(e) => (e.preventDefault(), setDrag(true))}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) read(f);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${drag ? "border-ink bg-lime/20" : "border-line hover:border-steel"}`}
          >
            <Icon n="upload" s={28} className="text-steel" />
            <span className="font-extrabold text-sm">{file || "اسحب الملف هنا أو اضغط للاختيار"}</span>
            <span className="text-xs text-steel">{busy === "analyze" ? "جارٍ فحص الملف…" : "لن يُحفظ شيء قبل تأكيدك"}</span>
            <input
              ref={input}
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={!!busy}
              onChange={(e) => e.target.files?.[0] && read(e.target.files[0])}
            />
          </label>
          {missing.length > 0 && (
            <p role="alert" className="mt-3 text-sm font-bold text-red-700 flex gap-2">
              <Icon n="alert" s={18} className="shrink-0 mt-0.5" />
              عمود ناقص في الملف: {missing.join("، ")}. استخدم القالب الرسمي.
            </p>
          )}
        </Card>
      </div>

      {an && s && (
        <Card
          title="3. معاينة التغييرات"
          desc={`${file} • ${an.results.length} صف`}
          action={
            s.errors > 0 && (
              <button type="button" onClick={errorReport} className="btn btn-sm btn-ghost">
                <Icon n="download" s={16} />
                تقرير الأخطاء
              </button>
            )
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {(
              [
                ["update", "سيتم تحديثه", s.update, "bg-ink text-lime"],
                ["create", "منتج جديد", s.create, "bg-lime text-ink"],
                ["out", "سيصبح غير متوفر", s.out, "bg-amber-50 text-amber-800"],
                ["error", "مرفوض", s.errors, "bg-red-50 text-red-700"],
                ["error", "كود مكرر", s.duplicates, "bg-red-50 text-red-700"],
                ["same", "بدون تغيير", s.same, "bg-soft text-steel"],
              ] as [typeof filter, string, number, string][]
            ).map(([f, l, v, c], i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFilter(filter === f ? "all" : f)}
                className={`rounded-xl p-3 text-start transition ring-ink ${c} ${filter === f ? "ring-2" : ""}`}
              >
                <span className="block font-display text-2xl leading-none">{v}</span>
                <span className="block text-xs font-bold mt-1">{l}</span>
              </button>
            ))}
          </div>

          {an.newCategories.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-4 text-sm">
              <p className="font-extrabold text-amber-900 mb-1.5">تصنيفات جديدة غير موجودة ({an.newCategories.length})</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {an.newCategories.map((c) => (
                  <Badge key={c} cls="bg-white text-ink border border-amber-300">
                    {c}
                  </Badge>
                ))}
              </div>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-ink"
                  checked={newCats}
                  disabled={!!busy || !!done}
                  onChange={(e) => {
                    setNewCats(e.target.checked);
                    analyze(rows, e.target.checked);
                  }}
                />
                أوافق على إنشاء هذه التصنيفات
              </label>
              {!newCats && <p className="text-xs text-amber-800 mt-1">بدون الموافقة تُرفض الصفوف التي فيها تصنيف جديد.</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {(
              [
                ["all", "الكل"],
                ["update", "تحديث"],
                ["create", "جديد"],
                ["out", "غير متوفر"],
                ["error", "مرفوض"],
                ["same", "بدون تغيير"],
              ] as [typeof filter, string][]
            ).map(([f, l]) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-extrabold border ${filter === f ? "bg-ink text-white border-ink" : "border-line text-steel"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-line divide-y divide-line max-h-[28rem] overflow-y-auto">
            {shown.slice(0, 300).map((x) => (
              <div key={x.row} className="p-3 flex gap-3 items-start text-sm">
                <span className="text-xs text-steel w-12 shrink-0 pt-0.5">صف {x.row}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge cls={ACTION[x.action][1]}>{ACTION[x.action][0]}</Badge>
                    {x.becomesOut && x.action !== "error" && <Badge cls="bg-amber-50 text-amber-800">سيصبح غير متوفر</Badge>}
                    <b dir="ltr" className="font-mono text-xs">
                      {x.sku || "—"}
                    </b>
                    <span className="truncate">{x.name}</span>
                  </div>
                  {x.errors.length > 0 && (
                    <ul className="mt-1 text-xs text-red-700 font-bold space-y-0.5">
                      {x.errors.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  )}
                  {x.changes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-steel">
                      {x.changes.map(([l, a, b]) => (
                        <span key={l}>
                          {l}: {a && <s className="opacity-70">{a}</s>} ← <b className="text-ink">{b}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!shown.length && <p className="p-4 text-sm text-steel text-center">لا توجد صفوف هنا</p>}
            {shown.length > 300 && <p className="p-3 text-xs text-steel text-center">يظهر أول 300 صف من {shown.length}</p>}
          </div>

          {!done && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={confirm} disabled={!canSave} className="btn btn-md btn-primary">
                <Icon n="check" s={18} />
                {busy === "commit" ? `جارٍ الحفظ… ${progress}%` : `تأكيد التحديث (${s.create + s.update})`}
              </button>
              <button type="button" onClick={() => reset()} disabled={!!busy} className="btn btn-md btn-ghost">
                إلغاء
              </button>
              <p className="text-xs text-steel basis-full sm:basis-auto">
                {pending
                  ? "وافق على التصنيفات الجديدة أو عدّل الملف أولًا."
                  : s.errors
                    ? `${s.errors} صف مرفوض لن يُحفظ، والباقي يُحفظ دفعة واحدة.`
                    : "كل التغييرات تُحفظ دفعة واحدة: إما كلها أو لا شيء."}
              </p>
              {busy === "commit" && (
                <div
                  className="basis-full h-2 rounded-full bg-soft overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-lime transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {done && (
        <Card title="4. النتيجة النهائية">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-lime text-ink shrink-0">
              <Icon n="check" s={24} />
            </span>
            <div className="text-sm leading-7">
              <p className="font-extrabold text-base">تم حفظ الملف بنجاح</p>
              <p>
                {done.updated} منتج حُدّث • {done.created} منتج جديد • {done.same} بدون تغيير • {done.rejected} مرفوض
              </p>
              {done.imageErrors.length > 0 && (
                <p className="text-amber-800">
                  تعذر تنزيل {done.imageErrors.length} صورة (الصفوف {done.imageErrors.map((x) => x.row).join("، ")}). أضفها من صفحة المنتج.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => reset()} className="btn btn-md btn-dark">
              <Icon n="upload" s={18} />
              رفع ملف آخر
            </button>
            {done.rejected > 0 && (
              <button type="button" onClick={errorReport} className="btn btn-md btn-ghost">
                <Icon n="download" s={18} />
                تقرير المرفوض
              </button>
            )}
          </div>
        </Card>
      )}

      <Card title="سجل التحديثات" desc="كل عملية مسجلة بالوقت والمستخدم. يمكن التراجع عن آخر عملية فقط.">
        {logs.length ? (
          <div className="divide-y divide-line -my-2">
            {logs.map((l) => (
              <div key={l.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Badge cls={l.kind === "stock" ? "bg-soft text-ink" : "bg-ink text-lime"}>{l.kind === "stock" ? "مخزون" : "منتجات"}</Badge>
                <span className="font-bold truncate max-w-[14rem]" dir="auto">
                  {l.fileName || "ملف"}
                </span>
                <span className="text-xs text-steel">
                  {fmt(l.createdAt)} • {l.adminName}
                </span>
                <span className="text-xs text-steel">
                  {l.updated} تحديث • {l.created} جديد • {l.rejected} مرفوض
                </span>
                <span className="ms-auto">
                  {l.undoneAt ? (
                    <Badge>تم التراجع • {l.undoneBy}</Badge>
                  ) : l.id === latestOpen ? (
                    <button type="button" onClick={() => openUndo(l.id)} disabled={!!busy} className="btn btn-sm btn-ghost text-red-700">
                      <Icon n="arrowUp" s={16} className="-rotate-90 rtl:rotate-90" />
                      تراجع
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-steel">لا توجد عمليات استيراد بعد.</p>
        )}
      </Card>

      <Modal
        open={!!plan}
        onClose={() => busy !== "undo" && setPlan(null)}
        title="مراجعة التراجع"
        sub={plan?.fileName}
        icon="alert"
        size="md"
      >
        {plan && (
          <div className="space-y-3 text-sm leading-7">
            <ul className="space-y-1">
              <li>• إرجاع القيم السابقة لـ {plan.restore} منتج</li>
              <li>• حذف {plan.remove} منتج أُضيف بالملف</li>
              {plan.hide > 0 && <li>• إخفاء {plan.hide} منتج جديد عليه طلبات (لا يُحذف للحفاظ على سجل الطلبات)</li>}
            </ul>
            {plan.conflicts.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-300 p-3">
                <p className="font-extrabold text-amber-900">تنبيه: {plan.conflicts.length} منتج عُدّل بعد الاستيراد وستضيع تعديلاته:</p>
                <p className="text-xs text-amber-900 mt-1">
                  {plan.conflicts
                    .slice(0, 12)
                    .map((c) => c.sku || c.name)
                    .join("، ")}
                  {plan.conflicts.length > 12 && " …"}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={doUndo}
                disabled={busy === "undo"}
                className="btn btn-md bg-red-600 text-white hover:bg-red-700"
              >
                {busy === "undo" ? "جارٍ التراجع…" : "تأكيد التراجع"}
              </button>
              <button type="button" onClick={() => setPlan(null)} disabled={busy === "undo"} className="btn btn-md btn-ghost">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
