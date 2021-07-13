import React from 'react'
import { Button } from './../ActiveButton/ActiveButton'
import { ActiveGameProperty, ActiveServer } from './../../pages/index'
import styles from './styles.module.scss'

interface SelectSessionProps {
  active: ActiveServer | ActiveGameProperty
  handleActive: any
  session: string[]
}

export function SelectSession({
  active,
  handleActive,
  session,
}: SelectSessionProps) {
  return (
    <section className={styles.container}>
      {session.map((buttonName, index) => (
        <Button
          id={index}
          label={buttonName}
          key={index}
          active={active}
          onClick={() => {
            handleActive(index, active)
          }}
        />
      ))}
    </section>
  )
}
