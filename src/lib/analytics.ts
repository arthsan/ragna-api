type GtagEventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const gaId = process.env.NEXT_PUBLIC_GA_ID

const canTrack = () =>
  typeof window !== 'undefined' && !!window.gtag && !!gaId

export const pageView = (options: {
  url: string
  title?: string
  path?: string
}) => {
  if (!canTrack()) return

  window.gtag?.('event', 'page_view', {
    page_location: options.url,
    page_title: options.title,
    page_path: options.path,
  })
}

export const trackEvent = (name: string, params: GtagEventParams = {}) => {
  if (!canTrack()) return

  window.gtag?.('event', name, params)
}
