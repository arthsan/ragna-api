import React from 'react'
import Link from 'next/link'
import styles from './styles.module.scss'

export function Header() {
  return (
    <header className={styles.container}>
      <h2>
        <Link href="/">Ragnarok Online Api</Link>
      </h2>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/documentation">Documentation</Link>
      </nav>
    </header>
  )
}
