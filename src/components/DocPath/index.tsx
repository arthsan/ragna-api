import React from 'react'

export function DocPath({route,db}) {
  return (
    <label>
      <button>GET</button>
      {route}
      <span>{db}</span>
    </label>
  )
}

