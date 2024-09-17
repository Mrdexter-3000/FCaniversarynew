/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AIRSTACK_API_KEY: process.env.AIRSTACK_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://fc-aniversary-v3.vercel.app',
  },
};

export default nextConfig;
