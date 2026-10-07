/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true }, // لا يوجد ESLint في المشروع؛ يمنع تحذير/توقف البناء بسببه
  experimental: { optimizePackageImports: ["zod"] },
  async headers() {
    return [
      // الصور المرفوعة أسماؤها فريدة (UUID) ولا تتغير، فتُحفظ في المتصفح سنة كاملة
      { source: "/uploads/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // ملفات الهوية أسماؤها ثابتة وقد تُستبدل: أسبوع مع التحقق في الخلفية
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};
