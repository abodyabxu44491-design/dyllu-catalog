// هيكل تحميل فوري عند التنقل بين أقسام لوحة التحكم (القائمة الجانبية تبقى ثابتة)
export default function Loading() {
  return (<div className="space-y-5" aria-busy="true" aria-label="جارٍ التحميل">
    <div className="space-y-2"><div className="skeleton h-9 w-48 rounded-full" /><div className="skeleton h-4 w-80 max-w-full" /></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
    <div className="card p-4 space-y-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="flex items-center gap-3"><div className="skeleton w-12 h-12 rounded-xl shrink-0" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/3" /></div></div>)}</div>
  </div>);
}
