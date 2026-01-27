type GtagEventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const gaId = process.env.NEXT_PUBLIC_GA_ID
const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === 'true'

const ensureGtag = () => {
  if (typeof window === 'undefined' || !gaId) return false

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
  }

  return true
}

export const pageView = (options: {
  url: string
  title?: string
  path?: string
}) => {
  if (!ensureGtag()) return

  window.gtag?.('event', 'page_view', {
    page_location: options.url,
    page_title: options.title,
    page_path: options.path,
    send_to: gaId,
    ...(gaDebug ? { debug_mode: true } : {}),
  })
}

export const trackEvent = (name: string, params: GtagEventParams = {}) => {
  if (!ensureGtag()) return

  window.gtag?.('event', name, {
    ...params,
    send_to: gaId,
    ...(gaDebug ? { debug_mode: true } : {}),
  })
}
