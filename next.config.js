/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      process.env.VERCEL_URL ? process.env.VERCEL_URL.replace('https://', '') : 'fc-aniversary-v3.vercel.app'
    ],
  },
  async headers() {
    return [
      {
        source: '/initial-animation-optimized.gif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
