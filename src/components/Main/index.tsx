import React from 'react'
import Image from 'next/dist/client/image'
import styles from './styles.module.scss'

export function Main() {
  return (
    <main className={styles.container}>
      <h1>
        <Image
          src="/images/ragtitle.png"
          alt="Ragnarok Online API"
          width={800}
          height={250}
        />
        {/* Ragnarok Online API */}
      </h1>
      <h2>
        All the Ragnarok data you will ever need in one place, easily accessible
        through a modern RESTful API.
      </h2>
      <p>Still in development!!</p>
    </main>
  )
}
