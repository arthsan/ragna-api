import styles from './styles.module.scss'
import { ActiveObject } from './../../pages/index'

interface ButtonProps {
  id: number
  label: string
  active: ActiveObject
  onClick: any
}

export function Button({ id, label, active, onClick }: ButtonProps) {
  function setActive() {
    if (active.objects[id].id === active.db) {
      return `${styles.active} ${styles.button}`
    }
    return styles.button
  }

  return (
    <button onClick={onClick} className={setActive()}>
      {label}
    </button>
  )
}
