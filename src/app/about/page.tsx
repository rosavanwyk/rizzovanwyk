import type { Metadata } from 'next'
import PortfolioPage from '@/components/PortfolioPage'
import StudioJsonLd from '@/components/StudioJsonLd'

export const metadata: Metadata = {
  title: 'About us | Rizzo / van Wyk',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <StudioJsonLd />
      <PortfolioPage showFirstCaseStudyAfterAbout />
    </>
  )
}
