import { Header } from 'components/Header'
import { Main } from 'components/Main'
import { Footer } from 'components/Footer'
import styles from './404.module.scss'

export default function Custom404() {
  return (
    <>
      <Header />
      <Main />
      <h2 className={styles.container}>Error 404</h2>
      <Footer />
    </>
  )
}
