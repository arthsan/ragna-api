import axios from 'axios'
import React, { FormEvent, useEffect, useState } from 'react'
import PrettyJsonView from 'pretty-json-view'
import styles from './styles.module.scss'

interface SearchBarProps {
  activeDb: string
  activeSearch: string
  firstFetch: any
}

export function SearchBar({
  activeDb,
  activeSearch,
  firstFetch,
}: SearchBarProps) {
  const [search, setSearch]: any = useState<number>(1001)
  const [result, setResult]: any = useState(firstFetch)
  const [_window, set_window]: any = useState('')
  const [searchId, setSearchId]: any = useState(1001)
  const [resourceActive, setResourceActive]: any = useState('monsters')
  const [resourceDb, setResourceDb]:any = useState('old-times')

  useEffect(() => {
    set_window(window)
  }, [])

  async function handleSearch(event: FormEvent) {
    event.preventDefault()

    try {
      const response = await axios.get(
        `${_window.location?.href}api/v1/${activeDb}/${activeSearch}/${search}`,
      )

      if (response.data) {
        setResult(response.data)
        setSearchId(search)
        setResourceActive(activeSearch)
        setResourceDb(activeDb)
      } else {
        alert(`Error getting ${activeSearch}`)
      }
    } catch {
      alert(`Error getting ${activeSearch}`)
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
          <h4>
            Resource for {resourceDb} {resourceActive}: {searchId}
          </h4>
          <PrettyJsonView data={result} />
        </>
      )}
    </div>
  )
}
