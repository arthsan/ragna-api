import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { AppProps } from 'next/app'
import Script from 'next/script'
import '../styles/globals.scss'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GTM_ID}`}
      />
      <Script strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.GTM_ID}',{
            page_path: window.location.pathname,
          });
          `}
      </Script>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export default MyApp
