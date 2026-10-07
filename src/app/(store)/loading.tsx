// هيكل تحميل أثناء جلب الصفحة (يظهر فورًا عند الانتقال بين الصفحات)
export default function Loading() {
  return (<div className="wrap pt-6 md:pt-8 space-y-6" aria-busy="true">
    <div className="skeleton h-9 w-44 rounded-full" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">{Array.from({ length: 8 }, (_, i) => <div key={i} className="space-y-3"><div className="skeleton aspect-square rounded-2xl" /><div className="skeleton h-4 w-3/4" /><div className="skeleton h-4 w-1/2" /></div>)}</div>
  </div>);
}
