/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'fc-aniversary-v31-updated-dex-tros-projects.vercel.app'],
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