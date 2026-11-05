import React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { BodyCustomCode, renderHeadCustomCode } from '@/components/custom-code'
import { makeSiteSettings, sanitizeHtmlAttribute } from '@/lib/site-settings'
import './styles.css'

const title = 'Rizzo / van Wyk'
const description =
  'Full-stack Design Duo. We bring together big-picture thinking and exceptional craft to build and evolve brands, products and experiences.'
const favicon = '/favicon.svg'
const socialImage = '/social-image.png'
const socialImageMetadata = socialImage
  ? {
      alt: 'Rizzo / van Wyk — Big thinking. Beautifully made.',
      height: 630,
      type: 'image/png',
      url: socialImage,
      width: 1200,
    }
  : undefined
const googleAnalyticsId = sanitizeHtmlAttribute(makeSiteSettings.analytics?.googleAnalyticsId)

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rizzovanwyk.com'),
  title,
  description,
  robots: makeSiteSettings.robots?.index === false ? { follow: false, index: false } : undefined,
  icons: favicon
    ? {
        apple: [{ sizes: '180x180', type: 'image/png', url: '/apple-touch-icon.png' }],
        icon: [
          { type: 'image/svg+xml', url: favicon },
          { sizes: '32x32', type: 'image/png', url: '/favicon-32x32.png' },
        ],
        shortcut: ['/favicon-32x32.png'],
      }
    : undefined,
  openGraph: {
    title,
    description,
    images: socialImageMetadata ? [socialImageMetadata] : undefined,
    siteName: 'Rizzo / van Wyk',
    type: 'website',
  },
  twitter: socialImageMetadata
    ? {
        card: 'summary_large_image',
        images: [socialImageMetadata],
      }
    : undefined,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const language = (sanitizeHtmlAttribute(makeSiteSettings.language) || 'en').toLowerCase()
  const addBypassLinks = makeSiteSettings.accessibility?.addBypassLinks === true
  const customScripts = makeSiteSettings.customScripts

  return (
    <html lang={language}>
      <head>
        <link
          rel="preload"
          href="/fonts/helvetica-now/HelveticaNowDisplay-Light.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/helvetica-now/HelveticaNowDisplay-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/RVW-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {renderHeadCustomCode(customScripts?.headStart, 'head-start')}
        {renderHeadCustomCode(customScripts?.headEnd, 'head-end')}
      </head>
      <body>
        <BodyCustomCode html={customScripts?.bodyStart} />
        {addBypassLinks && (
          <a className="figma-bypass-link" href="#root">
            Skip to content
          </a>
        )}
        <div id="root" tabIndex={-1}>
          {children}
        </div>
        {googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="figma-google-analytics" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(googleAnalyticsId)});
`}
            </Script>
          </>
        )}
        <BodyCustomCode html={customScripts?.bodyEnd} />
      </body>
    </html>
  )
}
