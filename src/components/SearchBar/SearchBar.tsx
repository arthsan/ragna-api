import axios from 'axios'
import React, { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export function SearchBar({activeDb}, activeSearch) {
  const [search, setSearch] = useState(1001)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()

    const response = await axios.get(
      `http://localhost:3000/api/v1/${activeDb}/${search}`,
    )
    console.log(response)
  }

  return (
    <form onSubmit={handleSearch}>
      <label htmlFor="">/api/v1/{activeDb}/</label>
      <input
        type="number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  )
}
