'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AboutContent, CaseStudy, CaseStudyNavigationItem, PopulatedMedia } from '@/lib/types'

type PortfolioClientProps = {
  activeCaseStudy: CaseStudy | null
  caseStudies: CaseStudyNavigationItem[]
  about: AboutContent
  showFirstCaseStudyAfterAbout?: boolean
}

const mediaDocument = (value: PopulatedMedia | null | undefined): PopulatedMedia | null =>
  value && typeof value === 'object' ? value : null

const projectPath = (project: CaseStudyNavigationItem) => `/${project.slug}`
const fullImageSizes = '(max-width: 1180px) 100vw, calc(100vw - 397px)'
const splitImageSizes = '(max-width: 1360px) 100vw, calc((100vw - 407px) / 2)'

const svgLogoRequests = new Map<string, Promise<Blob>>()
const preloadedHeroSources = new Set<string>()
const navigationScrollStorageKey = 'portfolio-navigation-scroll'
const themeStorageKey = 'portfolio-theme'
let retainedSidebarScrollTop = 0

function preloadProjectHero(project: CaseStudyNavigationItem) {
  const media = mediaDocument(project.heroImage)
  if (!media?.url || media.mimeType?.startsWith('video/')) return

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean }
    }
  ).connection
  if (connection?.saveData) return

  const source = media.url

  if (preloadedHeroSources.has(source)) return
  preloadedHeroSources.add(source)

  const image = new window.Image()
  image.decoding = 'async'
  image.fetchPriority = 'high'
  image.src = source
}

function loadSvgLogo(url: string) {
  const cachedRequest = svgLogoRequests.get(url)
  if (cachedRequest) return cachedRequest

  const request = fetch(url, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Logo request failed with ${response.status}`)
      }

      return response.text()
    })
    .then((svg) => new Blob([svg], { type: 'image/svg+xml' }))
    .catch((error: unknown) => {
      svgLogoRequests.delete(url)
      throw error
    })

  svgLogoRequests.set(url, request)
  return request
}

const withFullStop = (value: string) => {
  const subtitle = value.trimEnd()
  return !subtitle || subtitle.endsWith('.') ? subtitle : `${subtitle}.`
}

function IntroText({ project }: { project: CaseStudy }) {
  return (
    <section
      className="case-study-intro"
      aria-label={`${project.title} introduction`}
      data-text-block="INTRO TEXT"
    >
      <article className="case-study-text-panel case-study-text-panel--intro">
        <h2>
          <strong data-tina-field={project.tinaFields?.introTitle}>{project.intro.title}</strong>
          <span data-tina-field={project.tinaFields?.introSubtitle}>
            {withFullStop(project.intro.subtitle)}
          </span>
        </h2>
      </article>
      <article className="case-study-text-panel case-study-text-panel--intro">
        <p data-tina-field={project.tinaFields?.introCopy}>{project.intro.copy}</p>
      </article>
    </section>
  )
}

function CmsMedia({
  media,
  eager = false,
  sizes = fullImageSizes,
}: {
  media: PopulatedMedia
  eager?: boolean
  sizes?: string
}) {
  const containerRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldPrefetch, setShouldPrefetch] = useState(eager)
  const [displayDimensions, setDisplayDimensions] = useState(() => ({
    width: media.width || 2232,
    height: media.height || 1300,
  }))

  useEffect(() => {
    setIsLoaded(false)
    setDisplayDimensions({
      width: media.width || 2232,
      height: media.height || 1300,
    })

    if (eager) {
      setShouldPrefetch(true)
      return
    }

    setShouldPrefetch(false)

    const container = containerRef.current
    if (!container || !('IntersectionObserver' in window)) {
      setShouldPrefetch(true)
      return
    }

    const scrollContainer = container.closest<HTMLElement>('.case-studies')
    const preloadDistance = Math.round((scrollContainer?.clientHeight || window.innerHeight) * 0.25)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldPrefetch(true)
          observer.disconnect()
        }
      },
      {
        root: scrollContainer,
        rootMargin: `${preloadDistance}px 0px`,
      },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [eager, media.height, media.url, media.width])

  // Phones only autoplay a video if it is definitely muted, and some (e.g. iPhone
  // Low Power Mode, in-app browsers) still refuse. Force the mute, start it
  // ourselves, and retry on the visitor's first touch so no play button shows.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    const tryPlay = () => {
      if (video.paused) video.play().catch(() => {})
    }
    tryPlay()
    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('canplay', tryPlay)
    const onFirstTouch = () => tryPlay()
    window.addEventListener('touchstart', onFirstTouch, { passive: true })
    window.addEventListener('scroll', onFirstTouch, { passive: true, capture: true })
    return () => {
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('canplay', tryPlay)
      window.removeEventListener('touchstart', onFirstTouch)
      window.removeEventListener('scroll', onFirstTouch, { capture: true })
    }
  }, [media.url, shouldPrefetch])

  useEffect(() => {
    if (imageRef.current?.complete || (videoRef.current?.readyState ?? 0) >= 2) {
      setIsLoaded(true)
    }
  }, [media.url, shouldPrefetch])

  if (!media.url) return null

  const isVideo = media.mimeType === 'video/mp4' || media.mimeType === 'video/webm'
  const mp4Fallback = mediaDocument(media.mp4Fallback)
  const preservesAnimation = media.mimeType === 'image/gif'

  return (
    <figure
      ref={containerRef}
      className={`grand-panel image-placeholder ${isLoaded ? 'is-loaded' : ''}`}
      data-tina-field={media.tinaField}
      style={{
        aspectRatio: `${displayDimensions.width} / ${displayDimensions.height}`,
      }}
    >
      {shouldPrefetch &&
        (isVideo ? (
          <video
            key={media.url}
            ref={videoRef}
            aria-label={media.alt || 'Project video'}
            autoPlay
            className="grand-panel-image"
            loop
            muted
            onCanPlay={() => setIsLoaded(true)}
            onLoadedMetadata={(event) => {
              const { videoHeight, videoWidth } = event.currentTarget

              if (videoWidth > 0 && videoHeight > 0) {
                setDisplayDimensions({ width: videoWidth, height: videoHeight })
              }
            }}
            playsInline
            preload="auto"
          >
            <source src={media.url} type={media.mimeType || undefined} />
            {media.mimeType === 'video/webm' &&
              mp4Fallback?.mimeType === 'video/mp4' &&
              mp4Fallback.url && <source src={mp4Fallback.url} type="video/mp4" />}
          </video>
        ) : (
          <Image
            ref={imageRef}
            className="grand-panel-image"
            src={media.url}
            alt={media.alt || ''}
            fill
            sizes={sizes}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            onLoad={() => setIsLoaded(true)}
            unoptimized={preservesAnimation}
          />
        ))}
      {(media.caption?.title || media.caption?.lines) && !isBoxCaption(media) && (
        <div
          className={`media-caption media-caption--${media.caption.position === 'middle' ? 'middle' : 'top'} media-caption--${media.caption.tone === 'dark' ? 'dark' : 'light'}`}
        >
          <h2>
            {media.caption.title && <strong>{media.caption.title}</strong>}
            {media.caption.lines && <span>{media.caption.lines}</span>}
          </h2>
        </div>
      )}
    </figure>
  )
}

function isBoxCaption(media: PopulatedMedia) {
  const position = media.caption?.position
  return Boolean((media.caption?.title || media.caption?.lines) && (position === 'above' || position === 'below'))
}

function CaptionBox({ media }: { media: PopulatedMedia }) {
  const caption = media.caption
  if (!caption) return null
  const tone = caption.tone === 'dark' ? 'dark' : 'light'
  return (
    <article
      className={`case-study-text-panel media-stack-text media-stack-text--${tone}`}
      style={caption.background ? { background: caption.background } : undefined}
      data-tina-field={media.tinaField}
    >
      <h2>
        {caption.title && <strong>{caption.title}</strong>}
        {caption.lines && <span>{caption.lines}</span>}
      </h2>
    </article>
  )
}

function CmsNavigationLogo({ media }: { media: PopulatedMedia }) {
  if (!media.url) return null

  return <LazyNavigationLogo media={media} />
}

function LazyNavigationLogo({ media }: { media: PopulatedMedia }) {
  const isSvg = media.mimeType === 'image/svg+xml' || media.url?.endsWith('.svg')
  const [source, setSource] = useState<string | null>(isSvg ? null : media.url || null)

  useEffect(() => {
    if (!media.url) {
      setSource(null)
      return
    }

    if (!isSvg) {
      setSource(media.url)
      return
    }

    setSource(null)
    let isCurrent = true
    let objectUrl: string | null = null

    void loadSvgLogo(media.url!).then(
      (svg) => {
        if (isCurrent) {
          objectUrl = URL.createObjectURL(svg)
          setSource(objectUrl)
        }
      },
      () => {
        // Couldn't inline the SVG (e.g. served from another domain): show it as a plain image.
        if (isCurrent) setSource(media.url)
      },
    )

    return () => {
      isCurrent = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isSvg, media.url])

  return (
    <span className="project-logo">{source && <img src={source} alt="" decoding="async" />}</span>
  )
}

function HalfTextBlock({
  side,
  image,
  title,
  subtitle,
  copy,
  index,
  eager = false,
  tinaField,
}: {
  tinaField?: string
  side: 'left' | 'right'
  image?: PopulatedMedia | null
  title: string
  subtitle: string
  copy: string
  index: number
  eager?: boolean
}) {
  return (
    <section
      className={`case-study-half-text-row case-study-half-text-row--${side}`}
      aria-label={`TEXT ${side.toUpperCase()} ${index}`}
    >
      {image && <CmsMedia media={image} sizes={splitImageSizes} eager={eager} />}
      <article
        className={`case-study-text-panel case-study-text-panel--half case-study-text-panel--${side}`}
        data-text-block={`TEXT ${side.toUpperCase()} ${index}`}
        data-tina-field={tinaField}
      >
        <h2>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </h2>
        <p>{copy}</p>
      </article>
    </section>
  )
}

function NextProjectButton({
  project,
  onClick,
  onIntent,
}: {
  project: CaseStudyNavigationItem
  onClick: () => void
  onIntent: () => void
}) {
  return (
    <button
      className="next-project-button"
      type="button"
      onClick={onClick}
      onFocus={onIntent}
      onPointerDown={onIntent}
      onPointerEnter={onIntent}
    >
      <span className="next-project-name">
        {project.title} <span aria-hidden="true">→</span>
      </span>
    </button>
  )
}

function CreditsPanel({
  project,
  nextProject,
  onNext,
  onNextIntent,
}: {
  project: CaseStudy
  nextProject: CaseStudyNavigationItem
  onNext: () => void
  onNextIntent: () => void
}) {
  return (
    <footer className="credits-panel" data-text-block="CREDITS">
      <div className="credits-heading">
        <h2>Credits</h2>
        <p>{project.title}</p>
      </div>
      <div className="credits-grid" data-tina-field={project.tinaFields?.credits}>
        {(project.credits || []).map((credit) => (
          <section className="credit-column" key={credit.id} data-tina-field={credit.tinaField}>
            <h3>{credit.name}</h3>
            <ul>
              {(credit.roles || []).map((item) => (
                <li key={item.id}>{item.role}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <NextProjectButton project={nextProject} onClick={onNext} onIntent={onNextIntent} />
      <div className="credits-footer">
        <a href="https://rizzovanwyk.com" target="_blank" rel="noreferrer">
          rizzovanwyk.com
        </a>
        <span>©&nbsp;&nbsp; 2026</span>
      </div>
    </footer>
  )
}

function CaseStudyView({
  project,
  nextProject,
  onNext,
  onNextIntent,
  eagerMedia = true,
}: {
  project: CaseStudy
  nextProject: CaseStudyNavigationItem
  onNext: () => void
  onNextIntent: () => void
  eagerMedia?: boolean
}) {
  const hero = mediaDocument(project.heroImage)
  const blocks = project.blocks || []
  const firstMediaBlockIndex = blocks.findIndex((block) => block.blockType !== 'twoText')
  let leftIndex = 0
  let rightIndex = 0

  return (
    <section
      className="grand-case-study"
      id={project.slug}
      aria-label={`${project.title} case study`}
    >
      {hero ? (
        <div className="grand-panel-group">
          <CmsMedia media={hero} eager={eagerMedia} />
        </div>
      ) : (
        <div className="project-placeholder">
          <span>{project.title}</span>
        </div>
      )}

      <IntroText project={project} />

      {blocks.map((block, blockIndex) => {
        const isFirstMediaBlock = blockIndex === firstMediaBlockIndex

        if (block.blockType === 'oneImage') {
          const image = mediaDocument(block.image)

          if (!image) return null

          return (
            <div className="grand-panel-group" key={block.id}>
              <CmsMedia media={image} eager={eagerMedia && isFirstMediaBlock} />
            </div>
          )
        }

        if (block.blockType === 'twoImages') {
          const images = (block.images || [])
            .map((item) => mediaDocument(item))
            .filter((item): item is PopulatedMedia => Boolean(item))

          if (!images.length) return null

          return (
            <div
              className={`grand-panel-group ${images.length === 2 ? 'grand-panel-group--split' : ''}`}
              key={block.id}
            >
              {images.map((media, mediaIndex) => {
                const item = (
                  <CmsMedia
                    media={media}
                    sizes={images.length === 2 ? splitImageSizes : fullImageSizes}
                    eager={eagerMedia && isFirstMediaBlock && mediaIndex === 0}
                    key={`${media.id}-${mediaIndex}`}
                  />
                )
                if (!isBoxCaption(media)) return item
                const box = <CaptionBox media={media} key="box" />
                return (
                  <div className="media-stack" key={`${media.id}-${mediaIndex}`}>
                    {media.caption?.position === 'below' ? [item, box] : [box, item]}
                  </div>
                )
              })}
            </div>
          )
        }

        if (block.blockType === 'twoText') {
          return (
            <section
              className="case-study-intro"
              aria-label="Two text panels"
              key={block.id}
              data-tina-field={block.tinaField}
            >
              <article className="case-study-text-panel case-study-text-panel--intro">
                <p>{block.leftText}</p>
              </article>
              <article className="case-study-text-panel case-study-text-panel--intro">
                <p>{block.rightText}</p>
              </article>
            </section>
          )
        }

        if (block.blockType === 'imageTextRight') {
          rightIndex += 1
          return (
            <HalfTextBlock
              side="right"
              image={mediaDocument(block.image)}
              title={block.title}
              subtitle={block.subtitle}
              copy={block.copy}
              index={rightIndex}
              eager={eagerMedia && isFirstMediaBlock}
              tinaField={block.tinaField}
              key={block.id}
            />
          )
        }

        leftIndex += 1
        return (
          <HalfTextBlock
            side="left"
            image={mediaDocument(block.image)}
            title={block.title}
            subtitle={block.subtitle}
            copy={block.copy}
            index={leftIndex}
            eager={eagerMedia && isFirstMediaBlock}
            tinaField={block.tinaField}
            key={block.id}
          />
        )
      })}

      <CreditsPanel
        project={project}
        nextProject={nextProject}
        onNext={onNext}
        onNextIntent={onNextIntent}
      />
    </section>
  )
}

/* Joins short words like "and" to the next word so they never end a line on their own. */
function keepShortWordsWithNext(text: string) {
  return text.replace(/(^|\s)(and|a|to|of|the|we|in|on|from)\s+/gi, (_, space, word) => `${space}${word}\u00A0`)
}

function AboutPage({ about }: { about: AboutContent }) {
  const f = about.tinaFields || {}
  const portraits = about.portraits

  return (
    <section className="about-section" id="about-us">
      <div className="about-hero">
        <div className="hero-marks" aria-hidden="true">
          <img src="/assets/50d1a.svg" alt="" />
          <img src="/assets/bdadd.svg" alt="" />
        </div>
        {portraits?.url && (
          <img
            className="hero-portraits"
            src={portraits.url}
            alt={portraits.alt || ''}
            data-tina-field={portraits.tinaField}
          />
        )}
        <div className="hero-statement">
          <span data-tina-field={f.statementLine1}>{about.statementLine1}</span>
          <strong data-tina-field={f.statementLine2}>{about.statementLine2}</strong>
        </div>
      </div>
      <div className="about-panels">
        <article className="about-panel">
          <h2 data-tina-field={f.aboutTitle}>{about.aboutTitle}</h2>
          <div className="panel-copy" data-tina-field={f.aboutParagraphs}>
            {(about.aboutParagraphs || []).flatMap((text) => text.split(/\n\s*\n/)).filter((paragraph) => paragraph.trim()).map((paragraph, index) => (
              <p key={index}>{keepShortWordsWithNext(paragraph)}</p>
            ))}
          </div>
        </article>
        <article className="about-panel">
          <h2 data-tina-field={f.servicesTitle}>{about.servicesTitle}</h2>
          <ul className="services-list" data-tina-field={f.services}>
            {(about.services || []).map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default function PortfolioClient({
  activeCaseStudy,
  caseStudies,
  about,
  showFirstCaseStudyAfterAbout = false,
}: PortfolioClientProps) {
  const pathname = usePathname()
  const pathnameSlug = pathname.replace(/^\/|\/$/g, '')
  const activeSlug = pathnameSlug
  const activeProject = activeCaseStudy?.slug === activeSlug ? activeCaseStudy : undefined
  const isMenu = !activeSlug
  const initialVisibleContentSlug = activeSlug || (showFirstCaseStudyAfterAbout ? 'about' : '')
  const [isLight, setIsLight] = useState(false)
  const [isMobileContentOpen, setIsMobileContentOpen] = useState(!isMenu) // phones land on the project menu at /
  const [isMenuHeaderCompact, setIsMenuHeaderCompact] = useState(retainedSidebarScrollTop > 40)
  const [isContentHeaderVisible, setIsContentHeaderVisible] = useState(true)
  const [visibleContentSlug, setVisibleContentSlug] = useState(initialVisibleContentSlug)
  const sidebarRef = useRef<HTMLElement>(null)
  const projectListRef = useRef<HTMLElement>(null)
  const caseStudiesRef = useRef<HTMLElement>(null)
  const lastContentScrollTop = useRef(0)

  useLayoutEffect(() => {
    setIsLight(window.localStorage.getItem(themeStorageKey) === 'light')
  }, [])

  useLayoutEffect(() => {
    if (!sidebarRef.current) return

    const storedScrollTop = window.sessionStorage.getItem(navigationScrollStorageKey)
    if (storedScrollTop !== null) {
      const parsedScrollTop = Number(storedScrollTop)
      if (Number.isFinite(parsedScrollTop)) retainedSidebarScrollTop = parsedScrollTop
    }

    sidebarRef.current.scrollTop = retainedSidebarScrollTop
    if (projectListRef.current) {
      projectListRef.current.scrollTop = retainedSidebarScrollTop
    }
    setIsMenuHeaderCompact(retainedSidebarScrollTop > 40)
  }, [])

  useEffect(() => {
    setIsMobileContentOpen(!isMenu)
    setIsContentHeaderVisible(true)
    setVisibleContentSlug(initialVisibleContentSlug)
    lastContentScrollTop.current = 0
    caseStudiesRef.current?.scrollTo({ top: 0 })
  }, [initialVisibleContentSlug, pathname, isMenu])

  const selectPath = (path: string) => {
    setIsMobileContentOpen(true)
    const navigationScrollTop = window.matchMedia('(min-width: 1181px)').matches
      ? projectListRef.current?.scrollTop
      : sidebarRef.current?.scrollTop
    retainedSidebarScrollTop = navigationScrollTop ?? retainedSidebarScrollTop
    window.sessionStorage.setItem(navigationScrollStorageKey, String(retainedSidebarScrollTop))

    if (path === pathname) {
      setIsContentHeaderVisible(true)
      setVisibleContentSlug(activeSlug)
      lastContentScrollTop.current = 0
      caseStudiesRef.current?.scrollTo({ top: 0 })
      return
    }

    // Make's preview proxy can reject Next's RSC transition request even though
    // the prerendered HTML route is healthy. A document navigation uses that
    // reliable static response and avoids the failed RSC request entirely.
    window.location.assign(path)
  }

  const prepareProject = (project: CaseStudyNavigationItem) => {
    preloadProjectHero(project)
  }

  const selectProject = (project: CaseStudyNavigationItem) => {
    prepareProject(project)
    selectPath(projectPath(project))
  }

  const toggleTheme = () => {
    setIsLight((current) => {
      const nextTheme = current ? 'dark' : 'light'
      window.localStorage.setItem(themeStorageKey, nextTheme)
      return nextTheme === 'light'
    })
  }

  const goHome = () => {
    retainedSidebarScrollTop = 0
    window.sessionStorage.setItem(navigationScrollStorageKey, '0')

    if (pathname !== '/') {
      window.location.assign('/')
      return
    }

    setIsMobileContentOpen(true)
    setIsContentHeaderVisible(true)
    setIsMenuHeaderCompact(false)
    setVisibleContentSlug('about')
    lastContentScrollTop.current = 0

    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'

    sidebarRef.current?.scrollTo({
      top: 0,
      behavior: scrollBehavior,
    })
    projectListRef.current?.scrollTo({
      top: 0,
      behavior: scrollBehavior,
    })
    caseStudiesRef.current?.scrollTo({
      top: 0,
      behavior: scrollBehavior,
    })
  }

  const retainNavigationScroll = (event: React.UIEvent<HTMLElement>) => {
    retainedSidebarScrollTop = event.currentTarget.scrollTop
    setIsMenuHeaderCompact(event.currentTarget.scrollTop > 40)
  }

  const updateHeaderVisibility = (
    scrollTop: number,
    lastScrollTop: React.MutableRefObject<number>,
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const delta = scrollTop - lastScrollTop.current
    if (scrollTop <= 8) setIsVisible(true)
    else if (delta > 6) setIsVisible(false)
    else if (delta < -6) setIsVisible(true)
    lastScrollTop.current = scrollTop
  }

  const activeIndex = activeProject
    ? caseStudies.findIndex((project) => project.id === activeProject.id)
    : -1
  const nextProject = caseStudies[(activeIndex + 1 + caseStudies.length) % caseStudies.length]
  const firstCaseStudySlug = activeCaseStudy?.slug
  const firstCaseStudyIndex = firstCaseStudySlug
    ? caseStudies.findIndex((project) => project.slug === firstCaseStudySlug)
    : -1
  const firstCaseStudyNextProject =
    firstCaseStudyIndex >= 0
      ? caseStudies[(firstCaseStudyIndex + 1) % caseStudies.length]
      : undefined
  const navigationActiveSlug = showFirstCaseStudyAfterAbout
    ? visibleContentSlug
    : activeProject?.slug

  const updateVisibleContent = (container: HTMLElement) => {
    if (!showFirstCaseStudyAfterAbout || !firstCaseStudySlug) return

    const firstCaseStudy = container.querySelector<HTMLElement>(
      `#${CSS.escape(firstCaseStudySlug)}`,
    )
    if (!firstCaseStudy) return

    const readingLine = container.scrollTop + container.clientHeight * 0.35
    setVisibleContentSlug(readingLine >= firstCaseStudy.offsetTop ? firstCaseStudySlug : 'about')
  }

  return (
    <main
      className={`portfolio ${isLight ? 'light-mode' : ''} ${
        isMobileContentOpen ? 'mobile-content-open' : ''
      }`}
    >
      <aside
        ref={sidebarRef}
        className="sidebar"
        aria-label="Portfolio navigation"
        onScroll={retainNavigationScroll}
      >
        <div className="sidebar-top">
          <header className={`brand-row ${isMenuHeaderCompact ? 'brand-row--compact' : ''}`}>
            <button
              className="brand-home-button"
              type="button"
              onClick={goHome}
              aria-label="Go to home"
            >
              <img className="wordmark" src="/assets/6f7b5.svg" alt="" />
            </button>
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-pressed={isLight}
            >
              <img className="brand-mark brand-mark--moon" src="/assets/4eff2.svg" alt="" />
              <img className="brand-mark brand-mark--sun" src="/assets/sun.svg" alt="" />
            </button>
          </header>
          <div className="contact">
            <a href="mailto:hi@rizzovanwyk.com">hi@rizzovanwyk.com</a>
            <a
              href="https://calendar.app.google/bS8fVe5UHuKbsNE38"
              target="_blank"
              rel="noreferrer"
            >
              Book a call
            </a>
          </div>
        </div>
        <nav className="project-list" ref={projectListRef} onScroll={retainNavigationScroll}>
          <button
            className={`project-button about-button ${
              navigationActiveSlug === 'about' ? 'is-active' : ''
            }`}
            type="button"
            onClick={() => selectPath('/about')}
            aria-pressed={navigationActiveSlug === 'about'}
          >
            <span className="about-icon" aria-hidden="true" data-tina-field={about.tinaFields?.navImage}>
              <img src={about.navImage || '/media/about/about-us-nav.png'} alt="" />
            </span>
            <span className="button-copy">
              <strong>About us</strong>
              <small data-tina-field={about.tinaFields?.navTagline}>{about.navTagline}</small>
            </span>
          </button>
          {caseStudies.map((project) => {
            const logo = mediaDocument(project.navigationLogo)
            return (
              <button
                className={`project-button ${
                  navigationActiveSlug === project.slug ? 'is-active' : ''
                }`}
                type="button"
                key={project.id}
                onClick={() => selectProject(project)}
                onFocus={() => prepareProject(project)}
                onPointerDown={() => prepareProject(project)}
                onPointerEnter={() => prepareProject(project)}
                aria-pressed={navigationActiveSlug === project.slug}
              >
                {logo?.url && <CmsNavigationLogo media={logo} />}
                <span className="button-copy">
                  <strong data-tina-field={project.tinaFields?.title}>{project.title}</strong>
                  <small data-tina-field={project.tinaFields?.category}>{project.category}</small>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>
      <section
        ref={caseStudiesRef}
        className="case-studies"
        aria-label="Portfolio content"
        onScroll={(event) => {
          updateHeaderVisibility(
            event.currentTarget.scrollTop,
            lastContentScrollTop,
            setIsContentHeaderVisible,
          )
          updateVisibleContent(event.currentTarget)
        }}
      >
        <header
          className={`mobile-case-header ${
            isContentHeaderVisible ? '' : 'mobile-header-is-hidden'
          }`}
        >
          <button
            className="mobile-back-button"
            type="button"
            onClick={() => setIsMobileContentOpen(false)}
            aria-label="Back to project menu"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="mobile-header-home-button"
            type="button"
            onClick={goHome}
            aria-label="Go to home"
          >
            <img className="mobile-header-logo" src="/assets/6f7b5.svg" alt="" />
          </button>
          <span className="mobile-case-title">
            {navigationActiveSlug === firstCaseStudySlug
              ? activeCaseStudy?.title
              : activeProject?.title || 'About us'}
          </span>
        </header>
        {activeProject && nextProject ? (
          <CaseStudyView
            project={activeProject}
            nextProject={nextProject}
            onNext={() => selectProject(nextProject)}
            onNextIntent={() => prepareProject(nextProject)}
          />
        ) : (
          <>
            <AboutPage about={about} />
            {showFirstCaseStudyAfterAbout && activeCaseStudy && firstCaseStudyNextProject && (
              <CaseStudyView
                project={activeCaseStudy}
                nextProject={firstCaseStudyNextProject}
                onNext={() => selectProject(firstCaseStudyNextProject)}
                onNextIntent={() => prepareProject(firstCaseStudyNextProject)}
                eagerMedia={false}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}
