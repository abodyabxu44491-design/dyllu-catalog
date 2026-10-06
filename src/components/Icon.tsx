// أيقونات SVG موحدة (بدل الإيموجي). الاستخدام: <Icon n="cart" s={20} />. أضف أيقونة جديدة هنا فقط.
const P: Record<string, string> = {
  cart: '<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', chev: '<path d="M9 6l6 6-6 6"/>',
  bag: '<path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 13h5M10 17h5"/>',
};
export default function Icon({ n, s = 20, className = "" }: { n: keyof typeof P; s?: number; className?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />;
}
