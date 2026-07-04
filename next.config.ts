import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/kindsight' : '';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: !isProd,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: {unoptimized: true},
  env: {NEXT_PUBLIC_BASE_PATH: basePath},
};

module.exports = withPWA(nextConfig);
