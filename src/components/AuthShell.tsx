import Link from "next/link";
import Icon, { type IconName } from "./Icon";
// تصميم موحّد لصفحتي دخول الإدارة والمندوبين بهوية DYLLU:
// كمبيوتر: لوحة هوية + النموذج جنبًا إلى جنب · تابلت/جوال: بطاقة في المنتصف فوق خلفية الهوية
type Role = "admin" | "rep";
const ROLES: Record<Role, { href: string; label: string; icon: IconName; points: string[] }> = {
  admin: { href: "/admin-login", label: "الإدارة", icon: "dash", points: ["المنتجات والأسعار والإعلانات", "الطلبات والعملاء والمناديب", "رموز QR وأكواد الجملة"] },
  rep: { href: "/rep-login", label: "المندوبين", icon: "users", points: ["طلباتك وعملاؤك في مكان واحد", "رابطك الخاص ورمز QR", "تحديث حالة الطلب بضغطة"] },
};
export default function AuthShell({ role, title, sub, children }: { role: Role; title: string; sub: string; children: React.ReactNode }) {
  return (<main dir="rtl" lang="ar" className="relative min-h-[100svh] bg-ink overflow-x-hidden flex p-4 sm:p-8 lg:p-10">
    {/* خلفية الهوية: معيّنات ليمونية وبرتقالية + نقاط خفيفة + شريط سفلي */}
    <span aria-hidden className="absolute inset-0 opacity-[.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
    <span aria-hidden className="absolute -top-40 -end-40 w-[26rem] h-[26rem] sm:w-[34rem] sm:h-[34rem] bg-lime rotate-45 rounded-[4.5rem]" />
    <span aria-hidden className="absolute -bottom-24 -start-20 w-56 h-56 sm:w-72 sm:h-72 bg-accent rotate-45 rounded-[3rem]" />
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-2 bg-lime shadow-[0_-3px_0_theme(colors.accent)]" />

    <div className="relative m-auto w-full max-w-[440px] lg:max-w-5xl animate-rise grid lg:grid-cols-[1fr_1.05fr] bg-white rounded-[2rem] overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,.75)]">
      {/* لوحة الهوية (كمبيوتر) */}
      <section className="hidden lg:flex relative flex-col justify-between gap-10 bg-[#232527] text-white p-10 xl:p-12 overflow-hidden">
        <span aria-hidden className="absolute -bottom-28 -end-28 w-80 h-80 rounded-full border-[40px] border-lime/10" />
        <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="relative h-11 w-auto self-start" />
        <div className="relative space-y-6">
          <span className="inline-grid place-items-center bg-white rounded-3xl p-3.5 shadow-2xl"><img src="/brand/logo-badge.png" alt="" className="h-24 w-auto" /></span>
          <b className="block font-display text-[2.6rem] leading-[1.05] text-lime" dir="ltr" style={{ textAlign: "start" }}>Discover<br />your Power</b>
          <ul className="space-y-3">{ROLES[role].points.map((p) => <li key={p} className="flex items-center gap-3 text-white/80"><span className="w-7 h-7 rounded-lg bg-lime text-ink grid place-items-center shrink-0"><Icon n="check" s={15} stroke={3} /></span>{p}</li>)}</ul>
        </div>
        <small className="relative text-white/60 text-xs">© {new Date().getFullYear()} DYLLU</small>
      </section>

      {/* النموذج */}
      <section className="relative flex flex-col p-6 sm:p-10 lg:p-12">
        <div className="lg:hidden dy-stripe -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 mb-6" />
        <img src="/brand/logo-wordmark.png" alt="DYLLU" className="lg:hidden h-11 sm:h-12 w-auto self-center mb-6" />
        {/* التبديل بين دخول الإدارة والمندوبين */}
        <nav aria-label="نوع الحساب" className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-soft mb-7">
          {(Object.keys(ROLES) as Role[]).map((k) => <Link key={k} href={ROLES[k].href} aria-current={k === role ? "page" : undefined}
            className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-extrabold transition ${k === role ? "bg-ink text-lime shadow-card" : "text-steel hover:text-ink"}`}><Icon n={ROLES[k].icon} s={17} />{ROLES[k].label}</Link>)}
        </nav>
        <h1 className="text-2xl sm:text-[1.7rem] leading-tight">{title}</h1>
        <p className="text-sm text-steel mt-2 mb-6 leading-6">{sub}</p>
        {children}
        <a href="/" className="mt-7 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-steel hover:text-ink self-center"><Icon n="external" s={16} />العودة للكتالوج</a>
      </section>
    </div>
  </main>);
}

// حقل إدخال بأيقونة على اليسار (الحقول بالإنجليزية/الأرقام) ومساحة لزر على اليمين
type FieldProps = { label: string; icon: IconName; end?: React.ReactNode; hint?: React.ReactNode; inputRef?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>;
export function AuthField({ label, icon, end, hint, inputRef, ...rest }: FieldProps) {
  return (<label className="block space-y-1.5"><span className="block text-sm font-bold">{label}</span>
    <span className="relative block"><Icon n={icon} s={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
      <input ref={inputRef} dir="ltr" {...rest} className={`field h-[3.25rem] rounded-2xl bg-soft border-transparent focus:bg-white pl-12 ${end ? "pr-12" : ""} text-[16px] font-semibold tracking-wide placeholder:font-normal placeholder:tracking-normal`} />
      {end && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{end}</span>}</span>
    {hint}</label>);
}
