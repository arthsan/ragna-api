import React from 'react'
import Image from 'next/image'
import { trackEvent } from 'lib/analytics'
import styles from './styles.module.scss'

export function Main() {
  const endpoints = [
    {
      label: 'Old Times monster (1001)',
      url: 'https://ragnapi.com/api/v1/old-times/monsters/1001',
    },
    {
      label: 'Renewal item (501)',
      url: 'https://ragnapi.com/api/v1/re-newal/items/501',
    },
  ]

  const handleCopy = async (value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Best-effort copy; no-op on failure.
    }
  }

  const handleOutboundLink = (
    label: string,
    url: string,
    location: string,
  ) => {
    trackEvent('outbound_link', {
      link_text: label,
      link_url: url,
      link_location: location,
    })
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>
        <Image
          src="/images/ragtitle.png"
          alt=""
          aria-hidden="true"
          width={800}
          height={250}
          unoptimized
          className={styles.heroImage}
          loading="eager"
          style={{ width: 'min(90vw, 800px)', height: 'auto' }}
        />
      </h1>
      <h2 className={styles.subtitle}>
        All the Ragnarok Online data you will ever need, served via a fast and
        friendly REST API for monsters, items, skills, and more.
      </h2>
      <p className={styles.intro}>
        RagnaAPI is a public, read-only API built for fans, developers, and
        tooling. Use it to build bots, wikis, analytics dashboards, or just
        explore game data without scraping.
      </p>
      <section className={styles.getStarted}>
        <h3>Get started</h3>
        <div className={styles.links}>
          <a href="/documentation">Documentation</a>
          <a href="/about">About the project</a>
          <a
            href="https://github.com/arthsan/ragna-api"
            onClick={() =>
              handleOutboundLink(
                'GitHub',
                'https://github.com/arthsan/ragna-api',
                'home_get_started',
              )
            }
          >
            GitHub
          </a>
        </div>
        <div className={styles.endpoints}>
          {endpoints.map((endpoint) => (
            <div key={endpoint.url} className={styles.endpoint}>
              <div>
                <strong>{endpoint.label}</strong>
                <code>{endpoint.url}</code>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent('copy_endpoint', {
                    endpoint_label: endpoint.label,
                    endpoint_url: endpoint.url,
                    endpoint_location: 'home_get_started',
                  })
                  handleCopy(endpoint.url)
                }}
                aria-label={`Copy ${endpoint.label} endpoint`}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
