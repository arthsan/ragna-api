import Head from 'next/head'
import Image from 'next/image'
import styles from './home.module.scss'
import { Button } from '../components/Button/Button'

export default function Home() {
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
          All the Ragnarok data you'll ever need in one place, easily accessible
          through a modern RESTful API.
        </h2>
        <p>Still in develpment!!</p>
        <h3>Next features :</h3>
        <ul>
          <li>Documentation</li>
          <li>Items</li>
          <li>Maps</li>
          <li>Vendors</li>
        </ul>
        <section>
          <Button api="/api/old-times" db="Old Times" />
          <Button api="/api/re-newal" db="RE:newal" />
          <Button api="/api/re-start" db="RE:start" />
        </section>
      </main>
      <div className={styles.copyright}>
        <a
          href="https://lafinca.studio/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Developed by LaFinca Studio
          <span>Arthur Durant</span>
          <span className={styles.logo}>
            <Image
              src="/images/LaFinca.png"
              alt="LaFinca Studio"
              width={100}
              height={100}
            />
          </span>
          <span>jun / 2021</span>
        </a>
      </div>
    </>
  )
}
