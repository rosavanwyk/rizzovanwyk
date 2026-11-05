import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { pageQuery } from './query'

const root = process.cwd()
const caseStudyDir = path.join(root, 'content/case-studies')

type Json = Record<string, any>

const readJson = (file: string): Json => JSON.parse(fs.readFileSync(file, 'utf8'))

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/** Mirrors the shape the Tina GraphQL API returns, so the page renders identically in and out of the editor. */
function shapeCaseStudy(filename: string, full: boolean): Json {
  const doc = readJson(path.join(caseStudyDir, `${filename}.json`))
  const base: Json = {
    __typename: 'CaseStudy',
    _sys: { filename },
    title: doc.title ?? null,
    category: doc.category ?? null,
    draft: doc.draft ?? false,
    navigationLogo: doc.navigationLogo ?? null,
    heroImage: doc.heroImage ?? null,
  }
  if (!full) return base

  return {
    ...base,
    intro: doc.intro ?? null,
    blocks: (doc.blocks ?? []).map(({ _template, ...rest }: Json) => ({
      __typename: `CaseStudyBlocks${capitalise(_template)}`,
      ...rest,
    })),
    credits: doc.credits ?? [],
  }
}

export function allCaseStudyFilenames() {
  return fs
    .readdirSync(caseStudyDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
}

function referencedFilename(reference: string | undefined) {
  return reference ? path.basename(reference, '.json') : null
}

export function orderedCaseStudies() {
  const site = readJson(path.join(root, 'content/site/site.json'))
  const existing = new Set(allCaseStudyFilenames())
  const ordered = (site.caseStudyOrder ?? [])
    .map((item: Json) => referencedFilename(item?.caseStudy))
    .filter((name: string | null): name is string => Boolean(name && existing.has(name)))
  const unique = [...new Set<string>(ordered)]
  const extras = [...existing].filter((name) => !unique.includes(name)).sort()
  return { site, ordered: unique, extras }
}

export function publishedSlugs() {
  const { ordered, extras } = orderedCaseStudies()
  return [...ordered, ...extras].filter((slug) => !shapeCaseStudy(slug, false).draft)
}

export function getPageData(activeSlug: string) {
  const { site, ordered, extras } = orderedCaseStudies()

  const data = {
    site: {
      __typename: 'Site',
      caseStudyOrder: ordered.map((name) => ({
        __typename: 'SiteCaseStudyOrder',
        caseStudy: shapeCaseStudy(name, false),
      })),
      about: site.about ?? null,
    },
    caseStudy: shapeCaseStudy(activeSlug, true),
  }

  return {
    query: pageQuery,
    variables: { relativePath: `${activeSlug}.json` },
    data,
    // Case studies not yet placed in the order list still show, at the end.
    extraCaseStudies: extras.map((name) => shapeCaseStudy(name, false)),
    mediaDimensions: readJson(path.join(root, 'content/media-dimensions.json')) as Record<
      string,
      { width: number; height: number }
    >,
  }
}

export type PageData = ReturnType<typeof getPageData>

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rizzovanwyk.com').replace(/\/$/, '')

/** Plain facts about a case study for page titles, descriptions and structured data. */
export function caseStudySeo(slug: string) {
  const doc = readJson(path.join(caseStudyDir, `${slug}.json`))
  const intro = doc.intro ?? {}
  const copy: string = (intro.copy ?? '').replace(/\s+/g, ' ').trim()
  const description = copy.length > 160 ? `${copy.slice(0, 157).replace(/\s+\S*$/, '')}…` : copy
  const hero: string | undefined = doc.heroImage?.src
  return {
    slug,
    title: (doc.title as string) ?? slug,
    category: (doc.category as string) ?? '',
    subtitle: (intro.subtitle as string) ?? '',
    description,
    fullDescription: copy,
    image: hero && !/\.(mp4|webm)$/i.test(hero) ? hero : undefined,
    credits: ((doc.credits ?? []) as { name: string; roles?: string[] }[]).map((c) => ({
      name: c.name,
      roles: c.roles ?? [],
    })),
  }
}
