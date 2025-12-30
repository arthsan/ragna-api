import React from 'react'
import { Footer } from 'components/Footer'
import { Header } from 'components/Header'
import { Seo } from 'components/Seo'
import { siteUrl } from 'lib/seo'
import styles from './about.module.scss'

export default function About() {
  const description =
    'Learn about RagnaAPI, a public Ragnarok Online REST API focused on preserving game data and supporting community projects.'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'About — RagnaAPI',
      url: `${siteUrl}/about`,
      description,
    },
  ]

  return (
    <>
      <Seo
        title="About — RagnaAPI"
        description={description}
        path="/about"
        ogType="article"
        jsonLd={jsonLd}
      />
      <Header />
      <main className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>About RagnaAPI</h1>
            <p>
              RagnaAPI is a public, read-only REST API created to keep the
              Ragnarok Online legacy alive. Our goal is to preserve game data
              and make reliable information available for tools, bots, wikis,
              dashboards, and community projects.
            </p>
            <p>
              The project exists because we want the history of the game to
              stay accessible even as servers, sources, and formats evolve.
            </p>
            <p>
              Ragnarok Online spans multiple eras, from classic pre-renewal
              content to modern updates. RagnaAPI helps organize this knowledge
              so developers can build experiences without re-collecting the
              same data again and again.
            </p>
            <div className={styles.links}>
              <a href="/documentation">Documentation</a>
              <a href="https://github.com/arthsan/ragna-api">GitHub</a>
            </div>
          </div>
          <div className={styles.heroMedia}>
            <img
              src="/images/monster-1039.png"
              alt="Ragnarok Online monster sprite (ID 1039)"
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
            />
            <p className={styles.caption}>
              Images and data are referenced from the iRO Wiki.
            </p>
          </div>
        </section>

        <section className={styles.mission}>
          <h2>Why this project exists</h2>
          <p>
            Ragnarok Online has a massive amount of historical information.
            RagnaAPI organizes those resources into a simple API so anyone can
            build products without scraping pages or maintaining duplicate
            databases.
          </p>
          <p>
            Our focus is longevity: documenting monsters, items, classes, and
            maps while keeping references to the community sources that made
            this knowledge possible.
          </p>
        </section>

        <section className={styles.resources}>
          <h2>What you can explore</h2>
          <div className={styles.cards}>
            <a
              className={styles.card}
              href="https://irowiki.org/wiki/Monster"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/images/monster-1001.png"
                alt="Monster entry"
                width={220}
                height={220}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>Monsters</h3>
                <p>Stats, drops, skills, and spawn locations.</p>
              </div>
            </a>
            <a
              className={styles.card}
              href="https://irowiki.org/wiki/Items"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/images/item-1001@8x.png"
                alt="Item entry"
                width={220}
                height={220}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>Items</h3>
                <p>
                  Consumables, equipment, cards, and crafting materials with
                  consistent identifiers.
                </p>
              </div>
            </a>
            <a
              className={styles.card}
              href="https://irowiki.org/wiki/World_Map"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/images/worldmap-moc_fild08@8x.png"
                alt="World map entry"
                width={220}
                height={220}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>World Map</h3>
                <p>
                  Regions, dungeons, and spawn areas that connect the world.
                </p>
              </div>
            </a>
            <a
              className={styles.card}
              href="https://irowiki.org/wiki/Classes"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/images/class-501@8x.png"
                alt="Classes entry"
                width={220}
                height={220}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>Classes</h3>
                <p>
                  Job trees, evolutions, and skill paths for every playstyle.
                </p>
              </div>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
