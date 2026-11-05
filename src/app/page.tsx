import type { Metadata } from 'next'
import PortfolioPage from '@/components/PortfolioPage'
import StudioJsonLd from '@/components/StudioJsonLd'

export const metadata: Metadata = {
  title: 'Rizzo / van Wyk — Brand & product design studio',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <StudioJsonLd />
      <PortfolioPage showFirstCaseStudyAfterAbout />
    </>
  )
}
