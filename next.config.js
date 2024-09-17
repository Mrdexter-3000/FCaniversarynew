/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AIRSTACK_API_KEY: process.env.AIRSTACK_API_KEY,
    APP_URL: process.env.APP_URL || process.env.VERCEL_URL || 'https://fc-aniversary-v3.vercel.app',
  },
};
export default nextConfig;
