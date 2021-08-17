import React from 'react'
import styles from './styles.module.scss'

export function Progress() {
  return (
    <div className={styles.container}>
      <h3>Next features :</h3>
      <ul>
        <li className={styles.done}>Documentation</li>
        <li className={styles.done}>Items</li>
        <li>Skills</li>
        <li>Maps</li>
        <li>Vendors</li>
      </ul>
    </div>
  )
}
