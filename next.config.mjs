/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true }, // لا يوجد ESLint في المشروع؛ يمنع تحذير/توقف البناء بسببه
};
