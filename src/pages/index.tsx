import Head from 'next/head'
import styles from './home.module.scss'
import { SearchBar } from '../components/SearchBar/SearchBar'

import { Footer } from '../components/Footer/Footer'
import { useEffect, useState } from 'react'
import { Header } from '../components/Header/Header'
import { Main } from '../components/Main/Main'
import { Progress } from '../components/Progress/Progress'
import { SelectSession } from '../components/SelectSession/SelectSession'
import { GetServerSideProps } from 'next'
import axios from 'axios'
import { mongoConnect } from '../services/mongodb'

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
    if (active.db && activeServer.objects[index].id !== 're-start') {
      setActiveServer({
        ...activeServer,
        db: activeServer.objects[index].id,
      })
      return
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

  return (
    <>
      <Head>
        <title>Ragnarok Online API</title>
        <meta name="description" content="Ragnarok Online game database API" />
        <meta name="author" content="LaFinca Studio" />
        <meta
          name="keywords"
          content="ragnarok, api, monsters, items, drop, rate, free, database"
        />
      </Head>
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
