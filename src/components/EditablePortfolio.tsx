'use client'

import { tinaField, useTina } from 'tinacms/dist/react'
import PortfolioClient from '@/components/PortfolioClient'
import type { AboutContent, CaseStudy, CaseStudyBlock, CaseStudyNavigationItem, PopulatedMedia } from '@/lib/types'

type Dimensions = Record<string, { width: number; height: number }>
type Json = Record<string, any>

const mimeTypes: Record<string, string> = {
  avif: 'image/avif', gif: 'image/gif', jpeg: 'image/jpeg', jpg: 'image/jpeg', mov: 'video/quicktime',
  mp4: 'video/mp4', png: 'image/png', svg: 'image/svg+xml', webm: 'video/webm', webp: 'image/webp',
}
const mimeOf = (src: string) => mimeTypes[src.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''] ?? 'image/webp'

const field = (object: Json | null | undefined, name?: string, index?: number) => {
  if (!object) return undefined
  try {
    return tinaField(object as any, name as any, index) || undefined
  } catch {
    return undefined
  }
}

/** Inside the editor, Tina serves media from its CDN (https://assets.tina.io/<id>/media/...). */
const localPath = (src: string) => src.replace(/^https?:\/\/assets\.tina\.io\/[^/]+(?=\/)/, '')

function toMedia(value: Json | string | null | undefined, dims: Dimensions, marker?: string): PopulatedMedia | null {
  const src = typeof value === 'string' ? value : value?.src
  if (!src) return null
  const key = localPath(src)
  const fallbackSrc = typeof value === 'object' ? value?.mp4Fallback : null
  return {
    id: src,
    url: src,
    alt: typeof value === 'object' ? value?.alt : null,
    mimeType: mimeOf(src),
    width: dims[key]?.width ?? null,
    height: dims[key]?.height ?? null,
    mp4Fallback: fallbackSrc ? { id: fallbackSrc, url: fallbackSrc, mimeType: mimeOf(fallbackSrc) } : null,
    caption: typeof value === 'object' ? value?.caption ?? null : null,
    tinaField: marker,
  }
}

function toNavigationItem(doc: Json, dims: Dimensions): CaseStudyNavigationItem {
  return {
    id: doc._sys?.filename,
    slug: doc._sys?.filename,
    title: doc.title ?? '',
    category: doc.category ?? '',
    navigationLogo: toMedia(doc.navigationLogo, dims),
    heroImage: toMedia(doc.heroImage, dims),
    tinaFields: { title: field(doc, 'title'), category: field(doc, 'category') },
  }
}

const blockType = (typename: string) => {
  const name = typename.replace(/^CaseStudyBlocks/, '')
  return (name.charAt(0).toLowerCase() + name.slice(1)) as CaseStudyBlock['blockType']
}

function toCaseStudy(doc: Json | null | undefined, dims: Dimensions): CaseStudy | null {
  if (!doc) return null
  const blocks = (doc.blocks ?? []).filter(Boolean).map((block: Json, index: number): CaseStudyBlock => {
    const type = blockType(block.__typename ?? '')
    const id = `${type}-${index}`
    const marker = field(block)
    if (type === 'twoImages') {
      return {
        id,
        blockType: type,
        tinaField: marker,
        images: (block.images ?? [])
          .map((image: Json, i: number) => toMedia(image, dims, field(block, 'images', i)))
          .filter(Boolean) as PopulatedMedia[],
      }
    }
    if (type === 'twoText') {
      return { id, blockType: type, tinaField: marker, leftText: block.leftText ?? '', rightText: block.rightText ?? '' }
    }
    if (type === 'oneImage') {
      return { id, blockType: type, tinaField: marker, image: toMedia(block.image, dims, field(block, 'image')) }
    }
    return {
      id,
      blockType: type as 'imageTextLeft' | 'imageTextRight',
      tinaField: marker,
      image: toMedia(block.image, dims, field(block, 'image')),
      title: block.title ?? '',
      subtitle: block.subtitle ?? '',
      copy: block.copy ?? '',
    }
  })

  return {
    ...toNavigationItem(doc, dims),
    heroImage: toMedia(doc.heroImage, dims, field(doc, 'heroImage')),
    intro: {
      title: doc.intro?.title ?? '',
      subtitle: doc.intro?.subtitle ?? '',
      copy: doc.intro?.copy ?? '',
      services: (doc.intro?.services ?? []).filter(Boolean),
    },
    tinaFields: {
      title: field(doc, 'title'),
      introTitle: field(doc.intro, 'title'),
      introSubtitle: field(doc.intro, 'subtitle'),
      introCopy: field(doc.intro, 'copy'),
      introServices: field(doc.intro, 'services'),
      credits: field(doc, 'credits'),
    },
    blocks,
    credits: (doc.credits ?? []).filter(Boolean).map((credit: Json, index: number) => ({
      id: `credit-${index}`,
      name: credit.name ?? '',
      roles: (credit.roles ?? []).map((role: string, i: number) => ({ id: `role-${i}`, role })),
      tinaField: field(credit),
    })),
  }
}

function toAbout(about: Json | null | undefined, dims: Dimensions): AboutContent {
  if (!about) return {}
  return {
    ...about,
    portraits: toMedia(about.portraits, dims, field(about, 'portraits')),
    tinaFields: Object.fromEntries(
      ['navImage', 'navTagline', 'statementLine1', 'statementLine2', 'aboutTitle', 'aboutParagraphs', 'servicesTitle', 'services'].map(
        (name) => [name, field(about, name)],
      ),
    ),
  }
}

export default function EditablePortfolio({
  query,
  variables,
  data: initialData,
  extraCaseStudies,
  mediaDimensions,
  showFirstCaseStudyAfterAbout,
}: {
  query: string
  variables: Json
  data: Json
  extraCaseStudies: Json[]
  mediaDimensions: Dimensions
  showFirstCaseStudyAfterAbout?: boolean
}) {
  const { data, isClient } = useTina({ query, variables, data: initialData }) as { data: Json; isClient?: boolean }

  const ordered = (data.site?.caseStudyOrder ?? [])
    .map((item: Json) => item?.caseStudy)
    .filter((doc: Json | null) => doc?._sys?.filename)
  const seen = new Set(ordered.map((doc: Json) => doc._sys.filename))
  const caseStudies = [...ordered, ...extraCaseStudies.filter((doc) => !seen.has(doc._sys.filename))]
    .filter((doc) => !doc.draft)
    .map((doc) => toNavigationItem(doc, mediaDimensions))

  void isClient
  return (
    <PortfolioClient
      activeCaseStudy={toCaseStudy(data.caseStudy, mediaDimensions)}
      caseStudies={caseStudies}
      about={toAbout(data.site?.about, mediaDimensions)}
      showFirstCaseStudyAfterAbout={showFirstCaseStudyAfterAbout}
    />
  )
}
