import JsonLd from './JsonLd'
import { caseStudySeo, publishedSlugs, siteUrl } from '@/lib/content'

/** Who the studio is and what it has made, for search engines and AI answer engines. */
export default function StudioJsonLd() {
  const work = publishedSlugs().map((slug) => caseStudySeo(slug))
  return (
    <>
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Rizzo / van Wyk',
        alternateName: ['Rizzo van Wyk', 'RVW'],
        url: `${siteUrl}/`,
      }}
    />
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'Rizzo / van Wyk',
        url: siteUrl,
        email: 'hi@rizzovanwyk.com',
        image: `${siteUrl}/social-image.png`,
        logo: `${siteUrl}/favicon-32x32.png`,
        description:
          'Full-stack Design Duo. We bring together big-picture thinking and exceptional craft to build and evolve brands, products and experiences.',
        slogan: 'Big thinking. Beautifully made.',
        founder: [
          { '@type': 'Person', name: 'Martin Rizzo', description: 'Brand, identity and visual culture' },
          { '@type': 'Person', name: 'Rosa van Wyk', description: 'Product and human behaviour' },
        ],
        knowsAbout: ['Brand identity', 'Brand strategy', 'Visual identity systems', 'Product design', 'UX design', 'Art direction'],
        subjectOf: work.map((w) => ({
          '@type': 'CreativeWork',
          name: w.title,
          genre: w.category || undefined,
          url: `${siteUrl}/${w.slug}`,
        })),
      }}
    />
    </>
  )
}
