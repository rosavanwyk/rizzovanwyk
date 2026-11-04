export type PopulatedMedia = {
  id: string
  url: string
  alt?: string | null
  mimeType: string
  width?: number | null
  height?: number | null
  mp4Fallback?: PopulatedMedia | null
  /** Click-to-edit marker for the Tina editor. */
  tinaField?: string
}

type TextFields = { title: string; subtitle: string; copy: string }

export type CaseStudyBlock =
  | { id: string; tinaField?: string; blockType: 'oneImage'; image?: PopulatedMedia | null }
  | { id: string; tinaField?: string; blockType: 'twoImages'; images?: PopulatedMedia[] }
  | ({ id: string; tinaField?: string; blockType: 'imageTextLeft' | 'imageTextRight'; image?: PopulatedMedia | null } & TextFields)
  | { id: string; tinaField?: string; blockType: 'twoText'; leftText: string; rightText: string }

export type CaseStudyNavigationItem = {
  id: string
  slug: string
  title: string
  category: string
  navigationLogo?: PopulatedMedia | null
  heroImage?: PopulatedMedia | null
  tinaFields?: Record<string, string | undefined>
}

export type CaseStudy = CaseStudyNavigationItem & {
  intro: TextFields
  blocks: CaseStudyBlock[]
  credits: Array<{ id: string; name: string; roles: Array<{ id: string; role: string }>; tinaField?: string }>
}

export type AboutContent = {
  portraits?: PopulatedMedia | null
  navImage?: string | null
  navTagline?: string | null
  statementLine1?: string | null
  statementLine2?: string | null
  aboutTitle?: string | null
  aboutParagraphs?: string[] | null
  servicesTitle?: string | null
  services?: string[] | null
  tinaFields?: Record<string, string | undefined>
}
