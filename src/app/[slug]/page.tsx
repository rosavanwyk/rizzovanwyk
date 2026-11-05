import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/JsonLd'
import PortfolioPage from '@/components/PortfolioPage'
import { caseStudySeo, publishedSlugs, siteUrl } from '@/lib/content'

export const dynamicParams = false

export function generateStaticParams() {
  // Case studies marked "Hidden (draft)" get no page at all.
  return publishedSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!publishedSlugs().includes(slug)) return {}
  const seo = caseStudySeo(slug)
  const title = `${seo.title}${seo.category ? ` — ${seo.category}` : ''} case study | Rizzo / van Wyk`
  return {
    title,
    description: seo.description || undefined,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description: seo.description || undefined,
      url: `/${slug}`,
      type: 'article',
      siteName: 'Rizzo / van Wyk',
    },
    twitter: { title, description: seo.description || undefined },
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!publishedSlugs().includes(slug)) notFound()
  const seo = caseStudySeo(slug)
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: `${seo.title} — ${seo.subtitle || 'case study'}`,
          headline: seo.title,
          genre: seo.category || undefined,
          description: seo.fullDescription || undefined,
          url: `${siteUrl}/${slug}`,
          image: seo.image ? `${siteUrl}${seo.image}` : undefined,
          creator: seo.credits.map((c) => ({
            '@type': /agency|studio/i.test(c.name) ? 'Organization' : 'Person',
            name: c.name,
            description: c.roles.join(', ') || undefined,
          })),
          publisher: { '@type': 'Organization', name: 'Rizzo / van Wyk', url: siteUrl },
        }}
      />
      <PortfolioPage activeSlug={slug} />
    </>
  )
}
