import { AppProps } from 'next/dist/next-server/lib/router/router'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '../styles/globals.scss'
import '../styles/json-viewer.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
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
      <SpeedInsights route={router.pathname} />
    </>
  )
}

export default MyApp
