import { useEffect, useState } from 'react'

export default function useReactJsonView() {
  const [ReactJson, setReactJson]: any = useState(null)

  useEffect(() => {
    import('react-json-view')
      .then((x) => x.default)
      .then((ReactJson) => {
        setReactJson(new ReactJson)
      })
  }, [])

  return ReactJson
}
