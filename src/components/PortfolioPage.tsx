import EditablePortfolio from '@/components/EditablePortfolio'
import { getPageData, publishedSlugs } from '@/lib/content'

export default function PortfolioPage({
  activeSlug,
  showFirstCaseStudyAfterAbout = false,
}: {
  activeSlug?: string
  showFirstCaseStudyAfterAbout?: boolean
}) {
  const slug = activeSlug || publishedSlugs()[0]
  const page = getPageData(slug)

  return <EditablePortfolio {...page} showFirstCaseStudyAfterAbout={showFirstCaseStudyAfterAbout} />
}
