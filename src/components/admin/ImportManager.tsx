// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { toAsciiDigits } from "@/lib/phone";
import { toast } from "@/store/toast";
import { Badge, Card, PageHead } from "./ui";

const COLS: [string, string, RegExp, string][] = [
  ["اسم المنتج *", "name", /اسم|name/i, "مفتاح إنجليزي 10 إنش"],
  ["التصنيف *", "category", /تصنيف|قسم|category/i, "العدد اليدوية"],
  ["السعر", "price", /^(?!.*جمل).*سعر|^price/i, "45"],
  ["سعر الجملة", "wholesale", /جمل|wholesale/i, "38"],
  ["رقم الموديل", "sku", /موديل|sku|كود/i, "DTAW1110"],
  ["الوصف", "description", /وصف|description/i, "مفتاح من فولاذ C45 بفك قابل للضبط حتى 30 ملم"],
  ["المميزات (افصل بينها بـ |)", "features", /ميز|feature/i, "فولاذ عالي التحمل | فك دقيق الضبط"],
  ["المواصفات (الاسم: القيمة | ...)", "specs", /مواصف|spec/i, "الطول: 250 ملم | فتحة الفك: 0-30 ملم"],
  ["رابط الصورة", "image", /صور|image|photo/i, ""],
  ["متوفر (نعم/لا)", "inStock", /متوفر|stock/i, "نعم"],
  ["ظاهر (نعم/لا)", "isActive", /ظاهر|active|visible/i, "نعم"],
  ["مميز (نعم/لا)", "isFeatured", /مميز(?!ات)|featured/i, "لا"],
];
type Row = {
  row: number;
  name: string;
  category: string;
  price: number | null;
  wholesale: number | null;
  sku: string | null;
  description: string | null;
  features: string[];
  specs: [string, string][];
  image: string | null;
  inStock: boolean | null;
  isActive: boolean | null;
  isFeatured: boolean | null;
};
type Checked = Row & { errors: string[]; update: boolean };
type Result = { row: number; ok: boolean; action?: "created" | "updated"; id?: number; error?: string; warning?: string };

const str = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
const num = (v: unknown): number | null | undefined => {
  const s = toAsciiDigits(str(v))
    .replace(/[,٬\s]|ريال|ر\.?س|sar/gi, "")
    .replace("٫", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const bool = (v: unknown): boolean | null => {
  const s = str(v).toLowerCase();
  if (!s) return null;
  return /^(نعم|ايوه|أيوه|yes|y|true|1|✓|✔|x)$/.test(s) ? true : /^(لا|no|n|false|0)$/.test(s) ? false : null;
};
const list = (v: unknown) =>
  str(v)
    .split(/\s*[|\n؛;]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [],
    cell = "",
    q = false;
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
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

export default function ImportManager({ skus, categories }: { skus: string[]; categories: string[] }) {
  const r = useRouter(),
    input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState(""),
    [rows, setRows] = useState<Checked[]>([]),
    [drag, setDrag] = useState(false),
    [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(0),
    [results, setResults] = useState<Result[] | null>(null);
  const skuSet = useMemo(() => new Set(skus.map((s) => s.toLowerCase())), [skus]),
    catSet = useMemo(() => new Set(categories.map((c) => c.trim().toLowerCase())), [categories]);

  async function template() {
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const head = COLS.map(([h]) => ({ value: h, fontWeight: "bold" as const, backgroundColor: "#D0DF00", color: "#2B2D2F" }));
    const ex = (k: number) =>
      COLS.map((c) => ({
        value: k
          ? c[3]
              .replace("10 إنش", "12 إنش")
              .replace("DTAW1110", "DTAW1112")
              .replace("45", "55")
              .replace("38", "46")
              .replace("250", "300")
              .replace("0-30", "0-35")
          : c[3],
      }));
    await writeExcelFile([head, ex(0), ex(1)], {
      rightToLeft: true,
      columns: COLS.map(([, k]) => ({ width: k === "description" || k === "specs" || k === "features" ? 42 : k === "name" ? 30 : 16 })),
      stickyRowsCount: 1,
    } as never).toFile("DYLLU-products-template.xlsx");
  }

  async function read(f: File) {
    setResults(null);
    setDone(0);
    setFile(f.name);
    try {
      let grid: unknown[][];
      if (/\.csv$/i.test(f.name) || f.type === "text/csv") grid = parseCsv((await f.text()).replace(/^﻿/, ""));
      else {
        const { readSheet } = await import("read-excel-file/universal");
        grid = (await readSheet(f)) as unknown[][];
      }
      if (grid.length < 2) {
        setRows([]);
        return toast("الملف فارغ أو بدون صفوف منتجات", { tone: "err" });
      }
      const head = grid[0].map(str),
        idx: Record<string, number> = {};
      for (const [, k, re] of COLS) {
        const i = head.findIndex((h, j) => re.test(h) && !Object.values(idx).includes(j));
        if (i >= 0) idx[k] = i;
      }
      setMissing(["name", "category"].filter((k) => idx[k] == null).map((k) => COLS.find((c) => c[1] === k)![0]));
      const at = (row: unknown[], k: string) => (idx[k] == null ? null : row[idx[k]]);
      const seen = new Set<string>();
      const out = grid
        .slice(1)
        .map((g, n): Checked => {
          const errors: string[] = [],
            price = num(at(g, "price")),
            wholesale = num(at(g, "wholesale")),
            sku = str(at(g, "sku")) || null,
            image = str(at(g, "image")) || null;
          const specs = list(at(g, "specs")).map((x): [string, string] => {
            const m = x.match(/^(.+?)\s*[:：=]\s*(.+)$/);
            return m ? [m[1].trim(), m[2].trim()] : [x, ""];
          });
          const row: Row = {
            row: n + 2,
            name: str(at(g, "name")),
            category: str(at(g, "category")),
            price: price ?? null,
            wholesale: wholesale ?? null,
            sku,
            description: str(at(g, "description")) || null,
            features: list(at(g, "features")),
            specs: specs.filter(([a, b]) => a && b),
            image,
            inStock: bool(at(g, "inStock")),
            isActive: bool(at(g, "isActive")),
            isFeatured: bool(at(g, "isFeatured")),
          };
          if (!row.name) errors.push("اسم المنتج فارغ");
          if (!row.category) errors.push("التصنيف فارغ");
          if (price === undefined) errors.push("السعر ليس رقمًا");
          if (wholesale === undefined) errors.push("سعر الجملة ليس رقمًا");
          if (image && !/^https?:\/\/\S+$/i.test(image)) errors.push("رابط الصورة غير صحيح");
          if (specs.some(([, b]) => !b)) errors.push("مواصفة بدون قيمة (اكتبها: الاسم: القيمة)");
          if (sku) {
            if (seen.has(sku.toLowerCase())) errors.push("رقم الموديل مكرر في الملف");
            seen.add(sku.toLowerCase());
          }
          return { ...row, errors, update: !!sku && skuSet.has(sku.toLowerCase()) };
        })
        .filter((x) => x.name || x.category || x.sku);
      setRows(out);
      if (!out.length) toast("لم أجد منتجات في الملف", { tone: "err" });
    } catch {
      setRows([]);
      toast("تعذرت قراءة الملف. استخدم القالب بصيغة xlsx أو csv", { tone: "err" });
    }
  }

  const good = rows.filter((x) => !x.errors.length),
    news = good.filter((x) => !x.update).length,
    ups = good.length - news,
    bad = rows.length - good.length;
  const newCats = [...new Set(good.map((x) => x.category).filter((c) => !catSet.has(c.trim().toLowerCase())))];
  async function run() {
    setBusy(true);
    setDone(0);
    const all: Result[] = [];
    for (let i = 0; i < good.length; i += 5) {
      const batch = good.slice(i, i + 5).map(({ errors: _e, update: _u, ...x }) => x);
      try {
        const res = await fetch("/api/admin/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch }),
        });
        const d = await res.json();
        all.push(...(d.results ?? batch.map((b) => ({ row: b.row, ok: false, error: d.error || "تعذر الحفظ" }))));
      } catch {
        all.push(...batch.map((b) => ({ row: b.row, ok: false, error: "تعذر الاتصال" })));
      }
      setDone(Math.min(good.length, i + 5));
    }
    setResults(all);
    setBusy(false);
    r.refresh();
    const ok = all.filter((x) => x.ok).length;
    toast(`تم استيراد ${ok} من ${good.length} منتج`, { tone: ok === good.length ? "ok" : "err" });
  }
  const resOf = (row: number) => results?.find((x) => x.row === row);

  return (
    <div className="max-w-5xl space-y-4 md:space-y-5">
      <PageHead
        title="رفع منتجات من Excel"
        desc="أضف عشرات المنتجات مرة واحدة، أو حدّث أسعارها. اكتب بالعربية فقط، والإنجليزية تُترجم تلقائيًا."
        back={["/admin/products", "المنتجات"]}
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="1. نزّل القالب واملأه" desc="كل صف منتج. الاسم والتصنيف إلزاميان، والباقي اختياري.">
          <ul className="text-sm text-steel space-y-1.5 leading-6 mb-4">
            <li className="flex gap-2">
              <Icon n="check" s={16} className="text-ink mt-1 shrink-0" />
              رقم موديل موجود مسبقًا = <b className="text-ink">تحديث</b> المنتج (الخانات الفارغة لا تمسح شيئًا)
            </li>
            <li className="flex gap-2">
              <Icon n="check" s={16} className="text-ink mt-1 shrink-0" />
              تصنيف غير موجود يُنشأ تلقائيًا
            </li>
            <li className="flex gap-2">
              <Icon n="check" s={16} className="text-ink mt-1 shrink-0" />
              المميزات والمواصفات في خانة واحدة يفصل بينها{" "}
              <b className="text-ink" dir="ltr">
                |
              </b>
            </li>
            <li className="flex gap-2">
              <Icon n="check" s={16} className="text-ink mt-1 shrink-0" />
              الصور: ضع رابط صورة، أو أضفها لاحقًا من صفحة المنتج
            </li>
          </ul>
          <button onClick={template} className="btn btn-md btn-dark w-full sm:w-auto">
            <Icon n="download" s={18} />
            تنزيل القالب (Excel)
          </button>
        </Card>
        <Card title="2. ارفع الملف" desc="Excel (xlsx) أو CSV">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) read(f);
            }}
            className={`flex flex-col items-center justify-center gap-2 text-center rounded-2xl border-2 border-dashed p-6 min-h-[160px] cursor-pointer transition ${drag ? "border-accent bg-accent/5" : "border-line hover:border-steel hover:bg-soft"}`}
          >
            <input
              ref={input}
              type="file"
              hidden
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) read(f);
              }}
            />
            <span className="w-12 h-12 rounded-2xl bg-lime grid place-items-center">
              <Icon n="upload" s={24} />
            </span>
            <b className="text-sm">{file || "اسحب الملف هنا أو اضغط للاختيار"}</b>
            <small className="text-xs text-steel">{file ? `${rows.length} صف` : "حتى مئات المنتجات"}</small>
          </label>
        </Card>
      </div>

      {missing.length > 0 && (
        <p role="alert" className="card p-4 flex items-center gap-2 text-accent font-bold text-sm">
          <Icon n="alert" s={18} />
          لم أجد عمود: {missing.join("، ")}. استخدم القالب أو سمِّ الأعمدة بنفس الأسماء.
        </p>
      )}

      {rows.length > 0 && (
        <Card
          title="3. راجع ثم استورد"
          action={
            <div className="flex flex-wrap gap-1.5">
              <Badge cls="bg-lime text-ink">{news} جديد</Badge>
              <Badge cls="bg-ink text-lime">{ups} تحديث</Badge>
              {bad > 0 && <Badge cls="bg-accent text-white">{bad} فيه خطأ</Badge>}
            </div>
          }
        >
          {newCats.length > 0 && (
            <p className="text-xs text-steel mb-3 flex items-center gap-1.5">
              <Icon n="info" s={14} />
              تصنيفات جديدة ستُنشأ: <b className="text-ink">{newCats.join("، ")}</b>
            </p>
          )}
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-soft text-steel text-xs">
                <tr>
                  <th className="p-2 ps-4 text-start font-bold w-12">صف</th>
                  <th className="p-2 text-start font-bold">المنتج</th>
                  <th className="p-2 text-start font-bold">التصنيف</th>
                  <th className="p-2 text-start font-bold">السعر</th>
                  <th className="p-2 text-start font-bold">الجملة</th>
                  <th className="p-2 pe-4 text-start font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 300).map((x) => {
                  const res = resOf(x.row);
                  return (
                    <tr key={x.row} className={x.errors.length || res?.ok === false ? "bg-accent/5" : ""}>
                      <td className="p-2 ps-4 text-steel">{x.row}</td>
                      <td className="p-2">
                        <b className="block line-clamp-1">{x.name || "—"}</b>
                        <small className="text-xs text-steel" dir="ltr">
                          {x.sku}
                          {x.specs.length ? ` · ${x.specs.length} مواصفات` : ""}
                          {x.features.length ? ` · ${x.features.length} مميزات` : ""}
                          {x.image ? " · صورة" : ""}
                        </small>
                      </td>
                      <td className="p-2">{x.category}</td>
                      <td className="p-2 font-bold">{x.price ?? "—"}</td>
                      <td className="p-2 font-bold">{x.wholesale ?? "—"}</td>
                      <td className="p-2 pe-4">
                        {res ? (
                          res.ok ? (
                            <span className="text-xs font-bold">
                              <Link
                                href={`/admin/products/${res.id}`}
                                className="inline-flex items-center gap-1 text-[#586000] hover:underline"
                              >
                                <Icon n="check" s={14} stroke={3} />
                                {res.action === "updated" ? "حُدّث" : "أُضيف"}
                              </Link>
                              {res.warning && <small className="block text-accent font-normal">{res.warning}</small>}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-accent">{res.error}</span>
                          )
                        ) : x.errors.length ? (
                          <span className="text-xs font-bold text-accent">{x.errors.join("، ")}</span>
                        ) : x.update ? (
                          <Badge cls="bg-ink text-lime">تحديث</Badge>
                        ) : (
                          <Badge cls="bg-lime text-ink">جديد</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 300 && <p className="text-xs text-steel mt-2">يُعرض أول 300 صف، وسيُستورد الكل.</p>}
          <div className="mt-4 space-y-3">
            {busy && (
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-soft overflow-hidden">
                  <i className="block h-full bg-lime transition-all" style={{ width: `${(done / Math.max(1, good.length)) * 100}%` }} />
                </div>
                <small className="text-xs text-steel">
                  جارٍ الاستيراد والترجمة… {done} من {good.length}
                </small>
              </div>
            )}
            {results ? (
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/products" className="btn btn-lg btn-lime">
                  <Icon n="box" s={18} />
                  عرض المنتجات
                </Link>
                <button
                  onClick={() => {
                    setRows([]);
                    setResults(null);
                    setFile("");
                  }}
                  className="btn btn-lg btn-ghost"
                >
                  رفع ملف آخر
                </button>
              </div>
            ) : (
              <button disabled={busy || !good.length} onClick={run} className="btn btn-lg btn-lime w-full sm:w-auto">
                {busy ? (
                  "..."
                ) : (
                  <>
                    <Icon n="upload" s={18} />
                    استيراد {good.length} منتج
                  </>
                )}
              </button>
            )}
            {bad > 0 && !results && <p className="text-xs text-steel">الصفوف التي فيها خطأ ستُتجاهل. صححها في الملف وارفعه مرة أخرى.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
