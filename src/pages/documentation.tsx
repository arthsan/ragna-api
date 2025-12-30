import { Footer } from 'components/Footer'
import { Header } from 'components/Header'
import { JsonViewer } from 'components/JsonViewer'
import React from 'react'
import styles from './documentation.module.scss'
// import DocTable from 'components/DocTable'
import { DocPath } from 'components/DocPath'
import { items, monster } from 'utils/routes/routes'
import tableOldTimesMonster, {
  monsterOldTimes,
} from 'utils/mocks/monster/oldtimes'
import { monsterRenewal } from 'utils/mocks/monster/renewal'
import { monsterRestart } from 'utils/mocks/monster/restart'
import { itemOldTimes } from 'utils/mocks/items/oldtimes'
import { itemRenwal } from 'utils/mocks/items/renewal'
import { itemRestart } from 'utils/mocks/items/restart'
import { Seo } from 'components/Seo'
import { siteUrl } from 'lib/seo'

function Documentation() {
  const description =
    'RagnaAPI documentation with routes, sample payloads, and usage notes for monsters, items, and other Ragnarok Online resources.'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Documentation — RagnaAPI',
      url: `${siteUrl}/documentation`,
      description,
    },
  ]

  return (
    <>
      <Seo
        title="Documentation — RagnaAPI"
        description={description}
        path="/documentation"
        ogType="article"
        jsonLd={jsonLd}
      />
      <Header />
      <main className={styles.container}>
        <nav className={styles.sideBar}>
          <h2>Contents</h2>
          <ul>
            <li>
              <a href="#info">Information</a>
            </li>
            <li>
              <a href="#fair">Fair Use Policy</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
            <li>
              <a href="#lib">Wrapper Libraries</a>
            </li>
            <li>
              <a href="#db">Data Source</a>
            </li>
            <li>
              <a href="#monsters">Monsters</a>
            </li>
            <li>
              <a href="#items">Items</a>
            </li>
          </ul>
        </nav>
        <div className={styles.content}>
          <h1>Documentation</h1>
          <p>
            Explore available resources, example responses, and route patterns.
            Use these endpoints to build bots, tools, or dashboards around
            Ragnarok Online data.
          </p>
          <section id="info">
            <p>
              <strong>Quick tip:</strong> Use your browser`s ``find on page``
              feature to search for specific resource types (
              <button>Ctrl+F</button> or <button>Cmd+F</button> ).
            </p>

            <h2>Information</h2>
            <p>
              This is a consumption-only API — only the HTTP GET method is
              available on resources.
            </p>
            <p>
              No authentication is required to access this API, and all
              resources are fully open and available. Since the move to static
              hosting in June 2021, rate limiting has been removed entirely, but
              we still encourage you to limit the frequency of requests to limit
              our hosting costs.
            </p>
          </section>

          <section id='fair'>
            <h2>Fair Use Policy</h2>
            <p>
              Ragnapi is free and open to use. It is also very popular. Because
              of this, we ask every developer to abide by our fair use policy.
              People not complying with the fair use policy will have their IP
              address permanently banned.
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
          </section>

          <section id='contact'>
            <h2>Contact</h2>
            <p>
              Have questions? Ideas? Notice something amiss here in the docs?
              Hit us up on Slack. Sign up right here then visit our Slack team.
              We encourage you to come here before opening a ticket on GitHub,
              so we can keep our issues nice and organized. There are also a
              solid group of people using the API who may already have answers
              or plans from experience.
            </p>
          </section>

          <section id='lib'>
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
          </section>

          <div className={styles.route}>
            <section id='db'>
              <h2>Data Source</h2>
              <p>
                All the data is fetched from{' '}
                <a href="http://db.irowiki.org/"> http://db.irowiki.org/</a> and
                it is divided in 3 main sections:
                <ul>
                  <li>Old Times (pre-renewal)</li>
                  <li>Renewal</li>
                  <li>Restart (version created in europe)</li>
                </ul>
              </p>

              <p>
                Old times patch is <strong> 13.2 - Encounter with the Unknow </strong>
                Renwal patch is <strong> 17.2 - Legacy of the Wise One </strong>
              </p>
            </section>

            <section id='monsters'>
              <h2>Monsters</h2>

              <h3>Old Times</h3>

              <DocPath route={monster.oldTimes} db="[monster_id]" />

              <JsonViewer data={monsterOldTimes} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}

              <h3>Renewal</h3>

              <DocPath route={monster.renewal} db="[monster_id]" />

              <JsonViewer data={monsterRenewal} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}

              <h3>Restart</h3>

              <DocPath route={monster.restart} db="[monster_id]" />

              <JsonViewer data={monsterRestart} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}
            </section>

            <section id='items'>
              <h2>Items</h2>

              <h3>Old Times</h3>

              <DocPath route={items.oldTimes} db="[monster_id]" />

              <JsonViewer data={itemOldTimes} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}

              <h3>Renewal</h3>

              <DocPath route={items.renewal} db="[monster_id]" />

              <JsonViewer data={itemRenwal} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}

              <h3>Restart</h3>

              <DocPath route={items.restart} db="[monster_id]" />

              <JsonViewer data={itemRestart} />

              {/* <DocTable tableInfo={tableOldTimesMonster} /> */}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Documentation
