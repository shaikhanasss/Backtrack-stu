/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are used for auth + progress mutations
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
