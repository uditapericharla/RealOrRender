/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    if (!backend) return [];
    return [
      { source: '/api/backend/:path*', destination: `${backend}/api/:path*` },
    ];
  },
}

module.exports = nextConfig
