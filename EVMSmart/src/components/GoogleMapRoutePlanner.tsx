import { useEffect, useRef, useState } from 'react'
import { Loader2, LocateFixed, MapPinned, Navigation, Route, TrafficCone } from 'lucide-react'
import { GOOGLE_MAPS_AUTH_FAILURE_EVENT, getGoogleMapsApiKey, loadGoogleMaps } from '../lib/googleMapsLoader'
import OpenStreetMapFallback from './OpenStreetMapFallback'

type LatLngLiteral = { lat: number; lng: number }

type RouteSummary = {
  distanceText: string
  durationText: string
  startAddress: string
  endAddress: string
}

const defaultCenter: LatLngLiteral = { lat: 28.4595, lng: 77.0266 }

function totalRouteDistance(route: any) {
  return (route.legs ?? []).reduce((sum: number, leg: any) => sum + (leg.distance?.value ?? 0), 0)
}

function createMarker(googleMaps: any, options: Record<string, unknown>) {
  return new googleMaps.maps.Marker(options)
}

export default function GoogleMapRoutePlanner() {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const googleRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const trafficLayerRef = useRef<any>(null)
  const currentMarkerRef = useRef<any>(null)
  const destinationMarkerRef = useRef<any>(null)

  const [destination, setDestination] = useState('')
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null)
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null)
  const [loadingMap, setLoadingMap] = useState(true)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Loading Google Maps...')
  const [mapError, setMapError] = useState<string | null>(null)

  function updateCurrentMarker(position: LatLngLiteral) {
    if (!googleRef.current || !mapRef.current) return

    currentMarkerRef.current?.setMap(null)
    currentMarkerRef.current = createMarker(googleRef.current, {
      map: mapRef.current,
      position,
      title: 'Current location',
      icon: {
        path: googleRef.current.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    })
  }

  function updateDestinationMarker(position: LatLngLiteral) {
    if (!googleRef.current || !mapRef.current) return

    destinationMarkerRef.current?.setMap(null)
    destinationMarkerRef.current = createMarker(googleRef.current, {
      map: mapRef.current,
      position,
      title: 'Destination',
      icon: {
        path: googleRef.current.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#7c2d12',
        strokeWeight: 2,
      },
    })
  }

  function readCurrentLocation() {
    if (!navigator.geolocation) {
      setStatusMessage('Browser geolocation is not supported in this environment.')
      return
    }

    setStatusMessage('Requesting your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        setCurrentLocation(nextLocation)
        updateCurrentMarker(nextLocation)
        mapRef.current?.panTo(nextLocation)
        mapRef.current?.setZoom(14)
        setStatusMessage('Current location locked. Enter a destination to calculate the route.')
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied. Allow geolocation to route from your live position.'
            : error.code === error.POSITION_UNAVAILABLE
              ? 'Location is unavailable right now. Move to an area with better signal and retry.'
              : 'Location lookup timed out. Try refreshing your GPS position.'

        setStatusMessage(message)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  async function calculateRoute() {
    const trimmedDestination = destination.trim()

    if (!trimmedDestination) {
      setStatusMessage('Enter a destination before calculating the route.')
      return
    }

    if (!currentLocation || !googleRef.current || !mapRef.current) {
      setStatusMessage('Current location is still loading. Refresh GPS and try again.')
      return
    }

    setLoadingRoute(true)
    setStatusMessage('Geocoding destination and calculating the shortest drive...')

    try {
      const googleMaps = googleRef.current
      const geocoder = new googleMaps.maps.Geocoder()
      const directionsService = new googleMaps.maps.DirectionsService()

      const geocodeResult = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: trimmedDestination }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0])
            return
          }
          reject(new Error(`Destination lookup failed with status ${status}.`))
        })
      })

      const destinationLocation = geocodeResult.geometry.location.toJSON()
      updateDestinationMarker(destinationLocation)

      const directionsResult = await new Promise<any>((resolve, reject) => {
        directionsService.route(
          {
            origin: currentLocation,
            destination: destinationLocation,
            travelMode: googleMaps.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: googleMaps.maps.TrafficModel.BEST_GUESS,
            },
            unitSystem: googleMaps.maps.UnitSystem.METRIC,
          },
          (result: any, status: any) => {
            if (status === 'OK' && result) {
              resolve(result)
              return
            }
            reject(new Error(`Route calculation failed with status ${status}.`))
          },
        )
      })

      const shortestRouteIndex = directionsResult.routes.reduce((bestIndex: number, route: any, index: number) => {
        return totalRouteDistance(route) < totalRouteDistance(directionsResult.routes[bestIndex]) ? index : bestIndex
      }, 0)

      directionsRendererRef.current?.setDirections(directionsResult)
      directionsRendererRef.current?.setRouteIndex(shortestRouteIndex)

      const selectedRoute = directionsResult.routes[shortestRouteIndex]
      const firstLeg = selectedRoute.legs?.[0]

      if (firstLeg) {
        setRouteSummary({
          distanceText: firstLeg.distance?.text ?? '--',
          durationText: firstLeg.duration?.text ?? '--',
          startAddress: firstLeg.start_address ?? 'Current location',
          endAddress: firstLeg.end_address ?? trimmedDestination,
        })
      }

      setStatusMessage('Shortest route loaded. Traffic overlay is active on the map.')
    } catch (error) {
      setRouteSummary(null)
      setStatusMessage(error instanceof Error ? error.message : 'Unable to calculate the route.')
    } finally {
      setLoadingRoute(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrapMap() {
      try {
        const googleMaps = await loadGoogleMaps()
        if (cancelled || !mapElementRef.current) return

        googleRef.current = googleMaps
        mapRef.current = new googleMaps.maps.Map(mapElementRef.current, {
          center: defaultCenter,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        directionsRendererRef.current = new googleMaps.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeOpacity: 0.92,
            strokeWeight: 6,
          },
        })

        trafficLayerRef.current = new googleMaps.maps.TrafficLayer()
        trafficLayerRef.current.setMap(mapRef.current)

        setLoadingMap(false)
        setStatusMessage('Google Maps is ready. Fetching your current location...')
        readCurrentLocation()
      } catch (error) {
        setLoadingMap(false)
        const message = error instanceof Error ? error.message : 'Unable to load Google Maps.'
        setMapError(message)
        setStatusMessage(message)
      }
    }

    void bootstrapMap()

    return () => {
      cancelled = true
      currentMarkerRef.current?.setMap(null)
      destinationMarkerRef.current?.setMap(null)
      trafficLayerRef.current?.setMap(null)
      directionsRendererRef.current?.setMap(null)
    }
  }, [])

  useEffect(() => {
    const handleAuthFailure = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setMapError(detail || 'Google Maps authentication failed.')
      setLoadingMap(false)
      setStatusMessage(detail || 'Google Maps authentication failed.')
    }

    window.addEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
    return () => window.removeEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
  }, [])

  const missingApiKey = !getGoogleMapsApiKey()
  const showFallback = missingApiKey || Boolean(mapError)

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/85 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex flex-col gap-6 border-b border-slate-200/70 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.35em] text-sky-600">Google Maps Route Planner</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Live destination routing with traffic-aware visualization</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            The map loads with the Google Maps JavaScript API, pins your live location, calculates the shortest drivable route, and overlays real-time traffic.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
            <div className="text-xs uppercase tracking-[0.25em] text-sky-700">Distance</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">{routeSummary?.distanceText ?? '--'}</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <div className="text-xs uppercase tracking-[0.25em] text-emerald-700">ETA</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">{routeSummary?.durationText ?? '--'}</div>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-700">Traffic</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">Enabled</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPinned className="h-4 w-4 text-sky-300" />
              Destination Input
            </div>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Destination</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Enter a hospital, address, or landmark"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-sky-400"
              />
            </label>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={readCurrentLocation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <LocateFixed className="h-4 w-4" />
                Refresh Current Location
              </button>
              <button
                type="button"
                onClick={() => void calculateRoute()}
                disabled={loadingMap || loadingRoute || missingApiKey}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingRoute ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
                {loadingRoute ? 'Calculating Route...' : 'Calculate Shortest Route'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <TrafficCone className="h-4 w-4 text-amber-600" />
              Live Map Status
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{statusMessage}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Navigation className="h-4 w-4 text-emerald-600" />
              Active Route
            </div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Origin</div>
                <div className="mt-1 text-slate-900">{routeSummary?.startAddress ?? 'Waiting for current location'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Destination</div>
                <div className="mt-1 text-slate-900">{routeSummary?.endAddress ?? 'No destination selected yet'}</div>
              </div>
            </div>
          </div>

          {missingApiKey ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your local environment before loading the map.
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-[28px] bg-slate-100 ring-1 ring-slate-200">
            {showFallback ? (
              <div className="h-[420px] w-full sm:h-[520px] xl:h-[620px]">
                <OpenStreetMapFallback center={currentLocation ?? defaultCenter} zoom={13} label="Route Planner" />
              </div>
            ) : (
              <div ref={mapElementRef} className="h-[420px] w-full sm:h-[520px] xl:h-[620px]" />
            )}
            {loadingMap && !showFallback ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/20 backdrop-blur-[2px]">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-slate-900 shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initializing Google Maps
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
