import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Smaller copies of each image are made at build time
    // (scripts/responsive-images.mjs) and picked by this loader.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
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
