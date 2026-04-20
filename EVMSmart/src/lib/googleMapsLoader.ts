declare global {
  interface Window {
    __initGoogleMaps?: () => void
    gm_authFailure?: () => void
    google?: any
  }
}

let googleMapsPromise: Promise<any> | null = null
export const GOOGLE_MAPS_AUTH_FAILURE_EVENT = 'google-maps-auth-failure'

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
}

export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  const apiKey = getGoogleMapsApiKey()

  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY environment variable.'))
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    let settled = false
    const resolveOnce = () => {
      if (settled) return
      settled = true
      resolve(window.google)
    }
    const rejectOnce = (message: string) => {
      if (settled) return
      settled = true
      googleMapsPromise = null
      reject(new Error(message))
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', resolveOnce, { once: true })
      existingScript.addEventListener('error', () => rejectOnce('Google Maps failed to load.'), { once: true })
      return
    }

    window.__initGoogleMaps = () => {
      resolveOnce()
      delete window.__initGoogleMaps
    }
    window.gm_authFailure = () => {
      const message = 'Google Maps authentication failed. Check API key, billing, and referrer restrictions.'
      window.dispatchEvent(new CustomEvent(GOOGLE_MAPS_AUTH_FAILURE_EVENT, { detail: message }))
      rejectOnce(message)
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.dataset.googleMapsLoader = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&callback=__initGoogleMaps`
    script.onerror = () => {
      rejectOnce('Google Maps failed to load. Check your API key and network access.')
    }
    document.head.appendChild(script)
  })

  return googleMapsPromise
}
