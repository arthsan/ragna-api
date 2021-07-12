import Head from 'next/head'
import styles from './home.module.scss'
import { SearchBar } from '../components/SearchBar/SearchBar'
import { Button } from '../components/ActiveButton/ActiveButton'
import { Footer } from '../components/Footer/Footer'
import { useState } from 'react'

export interface ActiveObject {
  db: string
  objects: Array<{ id: string }>
  activeSearch: string
  activeItem: {}
}

export default function Home() {
  const [activeObject, setActiveObject] = useState<ActiveObject>({
    db: 'old-times',
    objects: [{ id: 'old-times' }, { id: 're-newal' }, { id: 're-start' }],
    activeSearch: 'monsters',
    activeItem: {},
  })

  function handleActive(active: number) {
    setActiveObject({ ...activeObject, db: activeObject.objects[active].id })
  }

  return (
    <>
      <Head>
        <title>Ragnarok Online API</title>
        <meta name="description" content="Ragnarok Online game database" />
        <meta name="author" content="LaFinca Studio" />
        <meta
          name="keywords"
          content="ragnarok, api, monsters, items, drop, rate"
        />
      </Head>
      <main className={styles.container}>
        <h1>Ragnarok Online API</h1>
        <h2>
          All the Ragnarok data you will ever need in one place, easily
          accessible through a modern RESTful API.
        </h2>
        <p>Still in development!!</p>
        <h3>Next features :</h3>
        <ul>
          <li>Documentation</li>
          <li>Items</li>
          <li>Maps</li>
          <li>Vendors</li>
        </ul>
        <section>
          <Button
            id={0}
            label="Old Times"
            active={activeObject}
            onClick={() => handleActive(0)}
          />
          <Button
            id={1}
            label="RE:newal"
            active={activeObject}
            onClick={() => handleActive(1)}
          />
          <Button
            id={2}
            label="RE:start"
            active={activeObject}
            onClick={() => handleActive(2)}
          />
        </section>
        <SearchBar activeDb={activeObject.db} activeSearch={activeObject.activeSearch} />
      </main>
      <Footer />
    </>
  )
}
