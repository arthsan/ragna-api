import { Footer } from 'components/Footer'
import { Header } from 'components/Header'
import Head from 'next/head'
import PrettyJsonView from 'pretty-json-view'
import React from 'react'
import styles from './documentation.module.scss'
import monsterOldTimes from './../../utils/mock.json'

function Documentation() {
  return (
    <>
      <Head>
        <title>Ragnarok Online API</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <nav className={styles.sideBar}>
          <h2>Contents</h2>
          <ul>
            <li>
              <a href="">Information</a>
            </li>
            <li>
              <a href="">Fair Use Policy</a>
            </li>
            <li>
              <a href="">Contact</a>
            </li>
            <li>
              <a href="">Wrapper Libraries</a>
            </li>
            <li>
              <a href="">Data Source</a>
            </li>
            <li>
              <a href="">Monsters</a>
            </li>
            <li>
              <a href="">Items</a>
            </li>
          </ul>
        </nav>
        <div className={styles.content}>
          <p>
            <strong>Quick tip:</strong> Use your browser's "find on page"
            feature to search for specific resource types (
            <button>Ctrl+F</button> or <button>Cmd+F</button> ).
          </p>

          <h2>Information</h2>
          <p>
            This is a consumption-only API — only the HTTP GET method is
            available on resources.
          </p>
          <p>
            No authentication is required to access this API, and all resources
            are fully open and available. Since the move to static hosting in
            June 2021, rate limiting has been removed entirely, but we still
            encourage you to limit the frequency of requests to limit our
            hosting costs.
          </p>

          <h2>Fair Use Policy</h2>
          <p>
            Ragnapi is free and open to use. It is also very popular. Because of
            this, we ask every developer to abide by our fair use policy. People
            not complying with the fair use policy will have their IP address
            permanently banned.
          </p>
          <p>
            Ragnapi is primarily an educational tool, and we will not tolerate
            denial of service attacks preventing people from learning.
          </p>
          <strong>Rules:</strong>
          <ul>
            <li>Locally cache resources whenever you request them.</li>
            <li>Be nice and friendly to your fellow Ragnapi developers.</li>
          </ul>

          <h2>Contact</h2>
          <p>
            Have questions? Ideas? Notice something amiss here in the docs? Hit
            us up on Slack. Sign up right here then visit our Slack team. We
            encourage you to come here before opening a ticket on GitHub, so we
            can keep our issues nice and organized. There are also a solid group
            of people using the API who may already have answers or plans from
            experience.
          </p>

          <h2>Wrapper Libraries</h2>
          <ul>
            <li>
              <strong>NextJS - Vercel</strong>
            </li>
            <li>
              <strong>Typescript - NodeJS</strong>
            </li>
            <li>
              <strong>MongoDB</strong>
            </li>
            <li>
              <strong>CheerioJS</strong>
            </li>
          </ul>

          <div className={styles.route}>
            <h2>Data Source</h2>
            <p>
              Berries are small fruits that can provide HP and status condition
              restoration, stat enhancement, and even damage negation when eaten
              by Pokémon. Check out Bulbapedia for greater detail.
            </p>

            <label>
              <button>GET</button>
              https://ragnapi.com/api/v1/old-times/monsters/
              <span>[monster_id]</span>
            </label>
            <PrettyJsonView data={monsterOldTimes} />

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
                    <p>
                      The total number of resources available from this API.
                    </p>
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
                      <a>
                        NamedAPIResource
                      </a>
                    </i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Documentation
