import styles from './styles.module.scss'
import { ActiveGameProperty, ActiveServer } from './../../pages/index'

interface ButtonProps {
  id: number
  label: string
  active: ActiveServer | ActiveGameProperty
  onClick: any
}

export function Button({ id, label, active, onClick }: ButtonProps) {
  function setActive() {
    if (active.db) {
      if (active.objects[id].id === active.db) {
        return `${styles.active} ${styles.button}`
      } else if (label === 'RE:start')
        return `${styles.button} ${styles.inactive}`
      return styles.button
    }

    if (active.objects[id].id === active.collection) {
      return `${styles.active} ${styles.button}`
    } else if (label === 'Skills') {
      return `${styles.button} ${styles.inactive}`
    }
    return styles.button

  }

  return (
    <button onClick={onClick} className={setActive()}>
      {label}
    </button>
  )
}
