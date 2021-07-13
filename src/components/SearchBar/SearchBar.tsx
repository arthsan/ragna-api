import axios from 'axios'
import React, { FormEvent, useEffect, useState } from 'react'
import PrettyJsonView from 'pretty-json-view'
import styles from './styles.module.scss'
import useReactJsonView from '../../hooks/useReactJsonView'
import ReactJson from 'react-json-view'

interface SearchBarProps {
  activeDb: string
  activeSearch: string
}

export function SearchBar({ activeDb, activeSearch }: SearchBarProps) {
  const [search, setSearch]: any = useState<number>(1001)
  const [result, setResult]: any = useState('')
  const [_window, set_window]: any = useState('')
  // const ReactJson = useReactJsonView()

  useEffect(() => {
    set_window(window)
  }, [])

  console.log(ReactJson)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()

    try {
      const response = await axios.get(
        `${_window.location?.href}api/v1/${activeDb}/${activeSearch}/${search}`,
      )

      if (response) {
        setResult(response)
      }
    } catch {
      console.log('error getting data')
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch}>
        <label htmlFor="">
          {_window.location?.href}api/v1/{activeDb}/{activeSearch}/
        </label>
        <input
          type="number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {result && result !== '' && (
        <>
          <h4>Resource for {search}</h4>
          <ReactJson src={result} />
        </>
      )}
    </div>
  )
}
