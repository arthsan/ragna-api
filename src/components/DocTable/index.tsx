import React from 'react'

export function DocTable({tableInfo}) {
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>count</td>
            <td>
              <p>The total number of resources available from this API.</p>
            </td>
            <td>
              <i>integer</i>
            </td>
          </tr>
          <tr>
            <td>next</td>
            <td>
              <p>The URL for the next page in the list.</p>
            </td>
            <td>
              <i>string</i>
            </td>
          </tr>
          <tr>
            <td>previous</td>
            <td>
              <p>The URL for the previous page in the list.</p>
            </td>
            <td>
              <i>boolean</i>
            </td>
          </tr>
          <tr>
            <td>results</td>
            <td>
              <p>A list of named API resources.</p>
            </td>
            <td>
              list
              <i>
                <a>NamedAPIResource</a>
              </i>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default DocTable
