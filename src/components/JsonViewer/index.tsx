import React from 'react'
import styles from './styles.module.scss'

interface JsonViewerProps {
  data: unknown
}

function syntaxHighlight(
  json: string,
  classes: Record<string, string>,
) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'number'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'key' : 'string'
      } else if (/true|false/.test(match)) {
        cls = 'boolean'
      } else if (/null/.test(match)) {
        cls = 'null'
      }
      return `<span class="${classes[cls]}">${match}</span>`
    },
  )
}

export function JsonViewer({ data }: JsonViewerProps) {
  const json = JSON.stringify(data, null, 2) ?? ''
  const highlighted = syntaxHighlight(json, {
    key: styles.key,
    string: styles.string,
    number: styles.number,
    boolean: styles.boolean,
    null: styles.null,
  })

  return (
    <pre
      className={styles.viewer}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}
