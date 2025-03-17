/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // !! 경고 !!
    // 프로덕션 환경에서는 타입 오류를 수정하는 것이 좋습니다.
    // 이 설정은 임시 해결책으로만 사용하세요.
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! 경고 !!
    // 프로덕션 환경에서는 ESLint 오류를 수정하는 것이 좋습니다.
    // 이 설정은 임시 해결책으로만 사용하세요.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 