import type { LatLng } from '../components/SmartMapView'
import { loadGoogleMaps } from './googleMapsLoader'

export type HospitalPlace = {
  id: string
  name: string
  position: LatLng
  distanceKm: number
  address?: string
}

export type AddressSuggestion = {
  id: string
  label: string
  position?: LatLng
  placeId?: string
}

export type RoadRoute = {
  id: string
  distanceMeters: number
  durationSeconds: number
  geometry: LatLng[]
}

const fallbackAreas = [
  { label: 'Sector 29, Gurugram, Haryana', position: { lat: 28.4676, lng: 77.0714 } },
  { label: 'IFFCO Chowk, Gurugram, Haryana', position: { lat: 28.4744, lng: 77.0719 } },
  { label: 'MG Road, Gurugram, Haryana', position: { lat: 28.4799, lng: 77.0801 } },
  { label: 'Sushant Lok, Gurugram, Haryana', position: { lat: 28.4672, lng: 77.0824 } },
  { label: 'DLF Phase 2, Gurugram, Haryana', position: { lat: 28.4933, lng: 77.0893 } },
  { label: 'Medanta zone, Gurugram, Haryana', position: { lat: 28.4396, lng: 77.0409 } },
  { label: 'Sector 44, Gurugram, Haryana', position: { lat: 28.4574, lng: 77.0738 } },
  { label: 'Cyber City, Gurugram, Haryana', position: { lat: 28.4949, lng: 77.0895 } },
  { label: 'Sector 62, Noida, Uttar Pradesh', position: { lat: 28.6289, lng: 77.3649 } },
  { label: 'Sector 18, Noida, Uttar Pradesh', position: { lat: 28.5706, lng: 77.3260 } },
  { label: 'Sector 128, Noida, Uttar Pradesh', position: { lat: 28.5214, lng: 77.3087 } },
  { label: 'Pari Chowk, Greater Noida, Uttar Pradesh', position: { lat: 28.4744, lng: 77.5030 } },
  { label: 'Sector 137, Noida, Uttar Pradesh', position: { lat: 28.5024, lng: 77.4054 } },
  { label: 'Mayur Vihar, Delhi', position: { lat: 28.6045, lng: 77.2943 } },
  { label: 'Sarita Vihar, Delhi', position: { lat: 28.5290, lng: 77.2906 } },
  { label: 'Jasola, Delhi', position: { lat: 28.5450, lng: 77.2931 } },
  { label: 'Badarpur, Delhi', position: { lat: 28.4937, lng: 77.3021 } },
  { label: 'Sector 16, Faridabad, Haryana', position: { lat: 28.4089, lng: 77.3178 } },
  { label: 'Sector 21C, Faridabad, Haryana', position: { lat: 28.4229, lng: 77.3114 } },
] as const

const fallbackHospitals = [
  { id: 'fh-1', name: 'Medanta - The Medicity', position: { lat: 28.4396, lng: 77.0409 }, address: 'CH Baktawar Singh Rd, Sector 38, Gurugram' },
  { id: 'fh-2', name: 'Artemis Hospital', position: { lat: 28.4457, lng: 77.0869 }, address: 'Sector 51, Gurugram' },
  { id: 'fh-3', name: 'Fortis Memorial Research Institute', position: { lat: 28.4602, lng: 77.0726 }, address: 'Sector 44, Gurugram' },
  { id: 'fh-4', name: 'Max Hospital Gurgaon', position: { lat: 28.4592, lng: 77.0405 }, address: 'Sushant Lok, Gurugram' },
  { id: 'fh-5', name: 'Paras Health Gurugram', position: { lat: 28.4598, lng: 77.0942 }, address: 'Sector 43, Gurugram' },
  { id: 'fh-6', name: 'Park Hospital', position: { lat: 28.4225, lng: 77.0428 }, address: 'Sector 47, Gurugram' },
  { id: 'fh-7', name: 'Jaypee Hospital', position: { lat: 28.5183, lng: 77.3674 }, address: 'Sector 128, Noida' },
  { id: 'fh-8', name: 'Yatharth Super Speciality Hospital', position: { lat: 28.6282, lng: 77.3619 }, address: 'Sector 110, Noida' },
  { id: 'fh-9', name: 'Kailash Hospital', position: { lat: 28.5703, lng: 77.3272 }, address: 'Sector 27, Noida' },
  { id: 'fh-10', name: 'Fortis Hospital Noida', position: { lat: 28.5678, lng: 77.3263 }, address: 'Sector 62, Noida' },
  { id: 'fh-11', name: 'Metro Hospital and Heart Institute', position: { lat: 28.5665, lng: 77.3391 }, address: 'Sector 11, Noida' },
  { id: 'fh-12', name: 'Yatharth Hospital Greater Noida', position: { lat: 28.4740, lng: 77.5043 }, address: 'Greater Noida' },
  { id: 'fh-13', name: 'Apollo Hospital', position: { lat: 28.5418, lng: 77.2837 }, address: 'Sarita Vihar, New Delhi' },
  { id: 'fh-14', name: 'Indraprastha Apollo Hospital', position: { lat: 28.5416, lng: 77.2838 }, address: 'Mathura Road, New Delhi' },
  { id: 'fh-15', name: 'Fortis Escorts Heart Institute', position: { lat: 28.5601, lng: 77.2731 }, address: 'Okhla Road, New Delhi' },
  { id: 'fh-16', name: 'Asian Institute of Medical Sciences', position: { lat: 28.4218, lng: 77.3092 }, address: 'Sector 21A, Faridabad' },
  { id: 'fh-17', name: 'Sarvodaya Hospital', position: { lat: 28.3996, lng: 77.3098 }, address: 'Sector 8, Faridabad' },
] as const

function haversineKm(a: LatLng, b: LatLng) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

async function getGoogleMaps() {
  const googleMaps = await loadGoogleMaps()
  if (!googleMaps?.maps) {
    throw new Error('Google Maps API is unavailable')
  }
  return googleMaps
}

async function reverseGeocodeWithNominatim(location: LatLng, signal?: AbortSignal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Fallback reverse geocoding failed')
  }

  const data = (await response.json()) as {
    display_name?: string
    address?: {
      road?: string
      neighbourhood?: string
      suburb?: string
      city?: string
      town?: string
      county?: string
      state?: string
      village?: string
    }
  }

  const address = data.address
  const parts = [address?.road, address?.neighbourhood, address?.suburb, address?.city ?? address?.town ?? address?.village ?? address?.county, address?.state].filter(
    (value, index, array) => value && array.indexOf(value) === index,
  )

  return parts.join(', ') || data.display_name || ''
}

async function searchAddressSuggestionsWithNominatim(query: string, signal?: AbortSignal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Fallback autocomplete search failed')
  }

  const results = (await response.json()) as Array<{
    place_id: number
    display_name: string
    lat: string
    lon: string
  }>

  return results.map((item) => ({
    id: String(item.place_id),
    label: item.display_name,
    position: { lat: Number(item.lat), lng: Number(item.lon) },
  })) satisfies AddressSuggestion[]
}

async function fetchRoadRoutesWithOsrm(start: LatLng, end: LatLng, signal?: AbortSignal) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true&steps=false`,
    {
      signal,
      headers: { Accept: 'application/json' },
    },
  )

  if (!response.ok) {
    throw new Error('OSRM route lookup failed')
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distance: number
      duration: number
      geometry?: { coordinates: [number, number][] }
    }>
  }

  const routes =
    data.routes?.map((route, index) => ({
      id: `osrm-route-${index}`,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: (route.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng })),
    })) ?? []

  return routes.filter((route) => route.geometry.length >= 2)
}

let hiddenPlacesMap: any | null = null

function getHiddenPlacesMap(googleMaps: any) {
  if (hiddenPlacesMap) return hiddenPlacesMap

  const mapDiv = document.createElement('div')
  mapDiv.style.width = '1px'
  mapDiv.style.height = '1px'
  mapDiv.style.position = 'fixed'
  mapDiv.style.left = '-9999px'
  mapDiv.style.top = '-9999px'
  mapDiv.setAttribute('aria-hidden', 'true')
  document.body.appendChild(mapDiv)

  hiddenPlacesMap = new googleMaps.maps.Map(mapDiv, {
    center: { lat: 28.4595, lng: 77.0266 },
    zoom: 13,
  })

  return hiddenPlacesMap
}

function formatHumanReadableAddress(result: any) {
  const components = result?.address_components as Array<{ long_name: string; types: string[] }> | undefined
  const formattedAddress = typeof result?.formatted_address === 'string' ? result.formatted_address.trim() : ''

  if (!components?.length) {
    return formattedAddress || 'Current area available'
  }

  const pick = (...types: string[]) =>
    components.find((component) => types.some((type) => component.types.includes(type)))?.long_name

  const primary =
    pick('street_number') && pick('route')
      ? `${pick('street_number')} ${pick('route')}`
      : pick('premise', 'subpremise', 'route', 'sublocality_level_1', 'neighborhood')

  const secondary = pick('sublocality_level_1', 'sublocality', 'neighborhood', 'locality')
  const city = pick('locality', 'administrative_area_level_2')
  const state = pick('administrative_area_level_1')

  const parts = [primary, secondary, city, state].filter((value, index, array) => value && array.indexOf(value) === index)
  return parts.join(', ') || formattedAddress || 'Current area available'
}

function fallbackAreaLabel(location: LatLng) {
  const nearest = fallbackAreas
    .map((area) => ({ area, distanceKm: haversineKm(location, area.position) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]

  return nearest ? `Near ${nearest.area.label}` : 'Current area available'
}

function fallbackNearestHospitals(origin: LatLng) {
  return fallbackHospitals
    .map((hospital) => ({
      ...hospital,
      distanceKm: haversineKm(origin, hospital.position),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5)
}

export async function geocodePlaceId(placeId: string, signal?: AbortSignal) {
  const googleMaps = await getGoogleMaps()

  return new Promise<{ label: string; position: LatLng }>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const geocoder = new googleMaps.maps.Geocoder()
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', abortHandler, { once: true })

    geocoder.geocode({ placeId }, (results: any, status: string) => {
      signal?.removeEventListener('abort', abortHandler)

      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      if (status === 'OK' && results?.[0]) {
        resolve({
          label: results[0].formatted_address ?? 'Selected destination',
          position: results[0].geometry.location.toJSON(),
        })
        return
      }

      reject(new Error('Destination lookup failed'))
    })
  })
}

export async function reverseGeocodeLocation(location: LatLng, signal?: AbortSignal) {
  const googleMaps = await getGoogleMaps()

  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const geocoder = new googleMaps.maps.Geocoder()
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', abortHandler, { once: true })

    geocoder.geocode({ location }, async (results: any, status: string) => {
      signal?.removeEventListener('abort', abortHandler)

      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      if (status === 'OK' && results?.[0]) {
        const preciseResult =
          results.find((result: any) => result.geometry?.location_type === 'ROOFTOP') ??
          results.find((result: any) => result.geometry?.location_type === 'RANGE_INTERPOLATED') ??
          results[0]

        const formatted = formatHumanReadableAddress(preciseResult)
        if (formatted && formatted !== 'Current area available') {
          resolve(formatted)
          return
        }
      }

      try {
        const nominatimAddress = await reverseGeocodeWithNominatim(location, signal)
        if (nominatimAddress) {
          resolve(nominatimAddress)
          return
        }
      } catch {
        // Fall through to the coarse local-area fallback.
      }

      resolve(fallbackAreaLabel(location))
    })
  })
}

export async function geocodeAddress(query: string, signal?: AbortSignal) {
  const googleMaps = await getGoogleMaps()

  return new Promise<{ label: string; position: LatLng }>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const geocoder = new googleMaps.maps.Geocoder()
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', abortHandler, { once: true })

    geocoder.geocode({ address: query }, (results: any, status: string) => {
      signal?.removeEventListener('abort', abortHandler)

      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      if (status === 'OK' && results?.[0]) {
        resolve({
          label: results[0].formatted_address ?? query,
          position: results[0].geometry.location.toJSON(),
        })
        return
      }

      reject(new Error('Destination search failed'))
    })
  })
}

export async function searchAddressSuggestions(query: string, signal?: AbortSignal) {
  try {
    const googleMaps = await getGoogleMaps()

    const googleResults = await new Promise<AddressSuggestion[]>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      const service = new googleMaps.maps.places.AutocompleteService()
      const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
      signal?.addEventListener('abort', abortHandler, { once: true })

      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
        },
        (predictions: any, status: string) => {
          if (signal?.aborted) {
            signal?.removeEventListener('abort', abortHandler)
            reject(new DOMException('Aborted', 'AbortError'))
            return
          }

          if (status !== googleMaps.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
            signal?.removeEventListener('abort', abortHandler)
            resolve([])
            return
          }

          signal?.removeEventListener('abort', abortHandler)
          resolve(
            predictions.slice(0, 5).map((prediction: any) => ({
              id: prediction.place_id,
              placeId: prediction.place_id,
              label: prediction.description,
            })),
          )
        },
      )
    })

    if (googleResults.length > 0) {
      return googleResults
    }

    return await searchAddressSuggestionsWithNominatim(query, signal)
  } catch {
    return searchAddressSuggestionsWithNominatim(query, signal)
  }
}

export async function fetchNearestHospitals(origin: LatLng, signal?: AbortSignal) {
  const googleMaps = await getGoogleMaps()

  return new Promise<HospitalPlace[]>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const map = getHiddenPlacesMap(googleMaps)
    const service = new googleMaps.maps.places.PlacesService(map)
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', abortHandler, { once: true })

    service.nearbySearch(
      {
        location: origin,
        radius: 10000,
        type: 'hospital',
      },
      (results: any, status: string) => {
        signal?.removeEventListener('abort', abortHandler)

        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }

        if (status === googleMaps.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve(fallbackNearestHospitals(origin))
          return
        }

        if (status !== googleMaps.maps.places.PlacesServiceStatus.OK || !results?.length) {
          resolve(fallbackNearestHospitals(origin))
          return
        }

        const seen = new Set<string>()
        const hospitals = results
          .map((place: any): HospitalPlace | null => {
            const location = place.geometry?.location?.toJSON?.()
            if (!location) return null
            if (seen.has(place.name)) return null
            seen.add(place.name)

            return {
              id: place.place_id ?? place.name,
              name: place.name ?? 'Nearby Hospital',
              position: location,
              address: place.vicinity ?? undefined,
              distanceKm: haversineKm(origin, location),
            }
          })
          .filter((place: HospitalPlace | null): place is HospitalPlace => place !== null)
          .sort((a: HospitalPlace, b: HospitalPlace) => a.distanceKm - b.distanceKm)
          .slice(0, 5)

        resolve(hospitals.length > 0 ? hospitals : fallbackNearestHospitals(origin))
      },
    )
  })
}

export async function fetchRoadRoutes(start: LatLng, end: LatLng, signal?: AbortSignal) {
  const googleMaps = await getGoogleMaps()

  return new Promise<RoadRoute[]>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const service = new googleMaps.maps.DirectionsService()
    const abortHandler = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', abortHandler, { once: true })

    const normalizeRoutes = (result: any) => {
      const routes = result.routes.map((route: any, index: number) => {
        const leg = route.legs?.[0]
        const path = route.overview_path ?? []
        return {
          id: `route-${index}`,
          distanceMeters: leg?.distance?.value ?? 0,
          durationSeconds: leg?.duration_in_traffic?.value ?? leg?.duration?.value ?? 0,
          geometry: path.map((point: any) => point.toJSON()),
        }
      })

      return routes.filter((route: RoadRoute) => route.geometry.length >= 2)
    }

    const requestRoute = (request: Record<string, unknown>, fallbackToBasic: boolean) => {
      service.route(request, (result: any, status: string) => {
        if (signal?.aborted) {
          signal?.removeEventListener('abort', abortHandler)
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }

        if (status === 'OK' && result?.routes?.length) {
          signal?.removeEventListener('abort', abortHandler)
          resolve(normalizeRoutes(result))
          return
        }

        if (fallbackToBasic) {
          requestRoute(
            {
              origin: start,
              destination: end,
              travelMode: googleMaps.maps.TravelMode.DRIVING,
              provideRouteAlternatives: false,
              unitSystem: googleMaps.maps.UnitSystem.METRIC,
            },
            false,
          )
          return
        }

        signal?.removeEventListener('abort', abortHandler)
        void fetchRoadRoutesWithOsrm(start, end, signal)
          .then((routes) => {
            if (routes.length > 0) {
              resolve(routes)
              return
            }
            reject(new Error(`Route lookup failed (${status}).`))
          })
          .catch(() => reject(new Error(`Route lookup failed (${status}).`)))
      })
    }

    requestRoute(
      {
        origin: start,
        destination: end,
        travelMode: googleMaps.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: googleMaps.maps.TrafficModel.BEST_GUESS,
        },
        unitSystem: googleMaps.maps.UnitSystem.METRIC,
      },
      true,
    )
  })
}
