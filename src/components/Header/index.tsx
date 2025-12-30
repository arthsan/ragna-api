import React from 'react'
import Link from 'next/link'
import styles from './styles.module.scss'

export function Header() {
  return (
    <header className={styles.container}>
      <div className={styles.logo}>
        <Link href="/">RagnaAPI — Ragnarok Online REST API</Link>
      </div>
      <nav className={styles.nav}>
        <Link className={styles.navLink} href="/">
          Home
        </Link>
        <Link className={styles.navLink} href="/about">
          About
        </Link>
        <Link className={styles.navLink} href="/documentation">
          Documentation
        </Link>
      </nav>
    </header>
  )
}
