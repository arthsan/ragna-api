import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'

export function Footer() {
  return (
    <footer className={styles.copyright}>
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
    </footer>
  )
}
