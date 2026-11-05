import type { MetadataRoute } from 'next'
import { publishedSlugs, siteUrl } from '@/lib/content'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${siteUrl}/`, lastModified: now, priority: 1 },
    { url: `${siteUrl}/about`, lastModified: now, priority: 0.8 },
    ...publishedSlugs().map((slug) => ({ url: `${siteUrl}/${slug}`, lastModified: now, priority: 0.7 })),
  ]
}
