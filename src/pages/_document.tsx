import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocuments extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap"
            rel="stylesheet"
          />
          <link
            rel="shortcut icon"
            href="/images/blue-poring.png"
            type="image/x-icon"
          />
          <meta
            name="description"
            content="Ragnarok Online game database API"
          />
          <meta name="author" content="LaFinca Studio" />
          <meta
            name="keywords"
            content="ragnarok, api, monsters, items, drop, rate, free, database"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
