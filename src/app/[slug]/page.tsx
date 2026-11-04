import { notFound } from 'next/navigation'
import PortfolioPage from '@/components/PortfolioPage'
import { publishedSlugs } from '@/lib/content'

export const dynamicParams = false

export function generateStaticParams() {
  // Case studies marked "Hidden (draft)" get no page at all.
  return publishedSlugs().map((slug) => ({ slug }))
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!publishedSlugs().includes(slug)) notFound()
  return <PortfolioPage activeSlug={slug} />
}
