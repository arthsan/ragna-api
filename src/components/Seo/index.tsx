import Head from 'next/head'
import { defaultOgImage, siteName, siteUrl } from 'lib/seo'

type SeoProps = {
  title: string
  description: string
  path: string
  ogType?: 'website' | 'article'
  noIndex?: boolean
  jsonLd?: Record<string, unknown>[]
}

export function Seo({
  title,
  description,
  path,
  ogType = 'website',
  noIndex = false,
  jsonLd = [],
}: SeoProps) {
  const canonicalUrl = `${siteUrl}${path}`
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow'

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={defaultOgImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultOgImage} />

      <link rel="icon" href="/images/blue-poring.png" />

      {jsonLd.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  )
}
