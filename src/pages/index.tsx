import { SearchBar } from '../components/SearchBar'

import { Footer } from 'components/Footer'
import { useEffect, useState } from 'react'
import { Header } from 'components/Header'
import { Main } from 'components/Main'
import { Progress } from 'components/Progress'
import { SelectSession } from 'components/SelectSession'
import { GetServerSideProps } from 'next'
import axios from 'axios'
import { Seo } from 'components/Seo'
import { siteName, siteUrl } from 'lib/seo'

export interface ActiveServer {
  db: string
  objects: Array<{ id: string }>
  collection?: string
}

export interface ActiveGameProperty {
  collection: string
  objects: Array<{ id: string }>
  db?: string
}

export default function Home({ data }) {
  const [activeServer, setActiveServer] = useState<ActiveServer>({
    db: 'old-times',
    objects: [{ id: 'old-times' }, { id: 're-newal' }, { id: 're-start' }],
  })

  const [activeGameProperty, setActiveGameProperty] = useState<
    ActiveGameProperty
  >({
    collection: 'monsters',
    objects: [{ id: 'monsters' }, { id: 'items' }, { id: 'skills' }],
  })

  const buttonLabels = {
    db: ['Old Times', 'RE:newal', 'RE:start'],
    collection: ['Monsters', 'Items', 'Skills'],
  }

  function handleActive(index: number, active) {
    if (active.db) {
      setActiveServer({
        ...activeServer,
        db: activeServer.objects[index].id,
      })
    }
    if (
      active.collection &&
      activeGameProperty.objects[index].id !== 'skills'
    ) {
      setActiveGameProperty({
        ...activeGameProperty,
        collection: activeGameProperty.objects[index].id,
      })
    }
  }

  const description =
    'RagnaAPI is a public Ragnarok Online REST API for monsters, items, skills, and more. Fast, simple, and ready for bots, dashboards, and tools.'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/images/ragtitle.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
      description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'RagnaAPI — Ragnarok Online REST API (Monsters, Items, Skills, Maps)',
      url: siteUrl,
      description,
    },
  ]

  return (
    <>
      <Seo
        title="RagnaAPI — Ragnarok Online REST API (Monsters, Items, Skills, Maps)"
        description={description}
        path="/"
        ogType="website"
        jsonLd={jsonLd}
      />
      <Header />
      <Main />
      <Progress />
      <SelectSession
        session={buttonLabels.db}
        active={activeServer}
        handleActive={handleActive}
      />
      <SelectSession
        session={buttonLabels.collection}
        active={activeGameProperty}
        handleActive={handleActive}
      />

      <SearchBar
        activeDb={activeServer.db}
        activeSearch={activeGameProperty.collection}
        firstFetch={data}
      />
      <Footer />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data } = await axios.get(
    'https://ragna-api.vercel.app/api/v1/old-times/monsters/1001',
  )

  return {
    props: { data },
  }
}
