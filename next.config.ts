import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Media is already compressed when it is added, so it is served as-is.
    unoptimized: true,
  },
  async redirects() {
    return [
      // The Mangopay case study used to live at /case-study-1.
      { source: '/case-study-1', destination: '/mangopay', permanent: true },
    ]
  },
  async rewrites() {
    return [{ source: '/admin', destination: '/admin/index.html' }]
  },
}

export default nextConfig
