import { useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_AUTH_FAILURE_EVENT, getGoogleMapsApiKey, loadGoogleMaps } from '../lib/googleMapsLoader'
import OpenStreetMapFallback from './OpenStreetMapFallback'

export type LatLng = { lat: number; lng: number }

export type MapAmbulance = {
  id: string
  position: LatLng
  status: 'enroute' | 'idle' | 'arrived'
}

export type MapCamera = { id: string; position: LatLng; label: string }
export type MapCongestion = { id: string; position: LatLng; level: 'low' | 'medium' | 'high' }
export type MapPlace = { id: string; position: LatLng; label: string; kind?: 'hospital' | 'incident' | 'checkpoint' }

function markerSymbol(color: string) {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: color,
    fillOpacity: 0.96,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  }
}

export default function MapView(props: {
  center: LatLng
  zoom?: number
  ambulances?: MapAmbulance[]
  destination?: { label: string; position: LatLng }
  route?: LatLng[]
  congestion?: MapCongestion[]
  cameras?: MapCamera[]
  places?: MapPlace[]
  followPosition?: LatLng | null
  className?: string
}) {
  const {
    center,
    zoom = 13,
    ambulances = [],
    destination,
    route = [],
    congestion = [],
    cameras = [],
    places = [],
    followPosition = null,
    className,
  } = props

  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const googleRef = useRef<any>(null)
  const infoWindowRef = useRef<any>(null)
  const ambulanceMarkersRef = useRef<Map<string, any>>(new Map())
  const placeMarkersRef = useRef<Map<string, any>>(new Map())
  const cameraMarkersRef = useRef<Map<string, any>>(new Map())
  const congestionCirclesRef = useRef<Map<string, any>>(new Map())
  const destinationMarkerRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const missingApiKey = !getGoogleMapsApiKey()
  const showFallback = missingApiKey || Boolean(error)

  useEffect(() => {
    let cancelled = false

    async function setupMap() {
      try {
        const googleMaps = await loadGoogleMaps()
        if (cancelled || !mapElementRef.current) return

        googleRef.current = googleMaps
        mapRef.current = new googleMaps.maps.Map(mapElementRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        })
        infoWindowRef.current = new googleMaps.maps.InfoWindow()

        setLoading(false)
      } catch (setupError) {
        if (cancelled) return
        setLoading(false)
        setError(setupError instanceof Error ? setupError.message : 'Unable to load Google Maps.')
      }
    }

    void setupMap()

    return () => {
      cancelled = true
      ambulanceMarkersRef.current.forEach((marker) => marker.setMap(null))
      placeMarkersRef.current.forEach((marker) => marker.setMap(null))
      cameraMarkersRef.current.forEach((marker) => marker.setMap(null))
      congestionCirclesRef.current.forEach((circle) => circle.setMap(null))
      destinationMarkerRef.current?.setMap(null)
      routePolylineRef.current?.setMap(null)
      ambulanceMarkersRef.current.clear()
      placeMarkersRef.current.clear()
      cameraMarkersRef.current.clear()
      congestionCirclesRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const handleAuthFailure = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setError(detail || 'Google Maps authentication failed.')
      setLoading(false)
    }

    window.addEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
    return () => window.removeEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure)
  }, [])

  useEffect(() => {
    if (!mapRef.current || !googleRef.current) return

    const googleMaps = googleRef.current
    const map = mapRef.current
    const infoWindow = infoWindowRef.current

    const bindInfoWindow = (marker: any, title: string, subtitle: string) => {
      googleMaps.maps.event.clearListeners(marker, 'click')
      marker.addListener('click', () => {
        infoWindow.setContent(
          `<div style="font-size:12px"><div style="font-weight:600">${title}</div><div style="color:#475569;margin-top:4px">${subtitle}</div></div>`,
        )
        infoWindow.open({ anchor: marker, map })
      })
    }

    const syncMarkers = <T extends { id: string; position: LatLng; label?: string; status?: string; kind?: string }>(
      items: T[],
      markerMap: Map<string, any>,
      createMarker: (item: T) => any,
      updateMarker: (marker: any, item: T) => void,
    ) => {
      const nextIds = new Set(items.map((item) => item.id))

      markerMap.forEach((marker, id) => {
        if (!nextIds.has(id)) {
          marker.setMap(null)
          markerMap.delete(id)
        }
      })

      items.forEach((item) => {
        const existingMarker = markerMap.get(item.id)
        if (existingMarker) {
          updateMarker(existingMarker, item)
          return
        }

        markerMap.set(item.id, createMarker(item))
      })
    }

    syncMarkers(
      ambulances,
      ambulanceMarkersRef.current,
      (ambulance) => {
        const marker = new googleMaps.maps.Marker({
          map,
          position: ambulance.position,
          title: ambulance.id,
          icon: markerSymbol('#ef4444'),
        })
        bindInfoWindow(marker, `Vehicle ${ambulance.id}`, 'Live GPS marker')
        return marker
      },
      (marker, ambulance) => {
        marker.setPosition(ambulance.position)
        marker.setTitle(ambulance.id)
        bindInfoWindow(marker, `Vehicle ${ambulance.id}`, 'Live GPS marker')
      },
    )

    if (destination) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new googleMaps.maps.Marker({
          map,
          position: destination.position,
          title: destination.label,
          icon: markerSymbol('#2563eb'),
        })
      } else {
        destinationMarkerRef.current.setMap(map)
        destinationMarkerRef.current.setPosition(destination.position)
        destinationMarkerRef.current.setTitle(destination.label)
      }
      bindInfoWindow(destinationMarkerRef.current, destination.label, 'Active destination')
    } else {
      destinationMarkerRef.current?.setMap(null)
    }

    syncMarkers(
      places,
      placeMarkersRef.current,
      (place) => {
        const marker = new googleMaps.maps.Marker({
          map,
          position: place.position,
          title: place.label,
          icon: markerSymbol(place.kind === 'hospital' ? '#2563eb' : '#10b981'),
        })
        bindInfoWindow(marker, place.label, 'Nearby support point')
        return marker
      },
      (marker, place) => {
        marker.setPosition(place.position)
        marker.setTitle(place.label)
        marker.setIcon(markerSymbol(place.kind === 'hospital' ? '#2563eb' : '#10b981'))
        bindInfoWindow(marker, place.label, 'Nearby support point')
      },
    )

    syncMarkers(
      cameras,
      cameraMarkersRef.current,
      (camera) => {
        const marker = new googleMaps.maps.Marker({
          map,
          position: camera.position,
          title: camera.label,
          icon: markerSymbol('#eab308'),
        })
        bindInfoWindow(marker, camera.label, 'Traffic camera')
        return marker
      },
      (marker, camera) => {
        marker.setPosition(camera.position)
        marker.setTitle(camera.label)
        bindInfoWindow(marker, camera.label, 'Traffic camera')
      },
    )

    const nextCongestionIds = new Set(congestion.map((item) => item.id))
    congestionCirclesRef.current.forEach((circle, id) => {
      if (!nextCongestionIds.has(id)) {
        circle.setMap(null)
        congestionCirclesRef.current.delete(id)
      }
    })

    congestion.forEach((item) => {
      const color = item.level === 'high' ? '#ef4444' : item.level === 'medium' ? '#f59e0b' : '#10b981'
      const existingCircle = congestionCirclesRef.current.get(item.id)

      if (existingCircle) {
        existingCircle.setCenter(item.position)
        existingCircle.setOptions({ strokeColor: color, fillColor: color })
        return
      }

      const circle = new googleMaps.maps.Circle({
        map,
        center: item.position,
        radius: 120,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.24,
      })
      congestionCirclesRef.current.set(item.id, circle)
    })

    if (route.length >= 2) {
      if (!routePolylineRef.current) {
        routePolylineRef.current = new googleMaps.maps.Polyline({
          map,
          path: route,
          strokeColor: '#2563eb',
          strokeOpacity: 0.95,
          strokeWeight: 5,
        })
      } else {
        routePolylineRef.current.setMap(map)
        routePolylineRef.current.setPath(route)
      }
    } else {
      routePolylineRef.current?.setMap(null)
    }
  }, [ambulances, cameras, congestion, destination, places, route])

  useEffect(() => {
    if (!mapRef.current || !googleRef.current) return

    const map = mapRef.current
    const googleMaps = googleRef.current

    if (followPosition) {
      map.panTo(followPosition)
      if ((map.getZoom?.() ?? zoom) < 15) {
        map.setZoom(15)
      }
      return
    }

    const bounds = new googleMaps.maps.LatLngBounds()
    let hasBounds = false
    const extendBounds = (point: LatLng) => {
      bounds.extend(point)
      hasBounds = true
    }

    ambulances.forEach((ambulance) => extendBounds(ambulance.position))
    if (destination) extendBounds(destination.position)
    places.forEach((place) => extendBounds(place.position))
    cameras.forEach((camera) => extendBounds(camera.position))
    congestion.forEach((item) => extendBounds(item.position))
    route.forEach(extendBounds)

    if (hasBounds) {
      map.fitBounds(bounds, 32)
      if (map.getZoom() > 15) {
        map.setZoom(15)
      }
      return
    }

    map.setCenter(center)
    map.setZoom(zoom)
  }, [ambulances, cameras, center, congestion, destination, followPosition, places, route, zoom])

  return (
    <div className={`min-w-0 overflow-hidden ${className ?? ''}`}>
      <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl bg-sky-50 shadow-lg ring-1 ring-sky-200/70">
        {showFallback ? (
          <OpenStreetMapFallback center={center} zoom={zoom} label="City Grid" />
        ) : (
          <div ref={mapElementRef} className="h-full w-full" />
        )}

        {loading && !showFallback ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/18 backdrop-blur-[2px]">
            <div className="rounded-full bg-white/92 px-4 py-2 text-sm font-medium text-slate-900 shadow-lg">Initializing Google Maps</div>
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
            {error}
          </div>
        ) : null}

        {missingApiKey ? (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
            Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to render the map.
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap gap-2 overflow-hidden">
          <div className="max-w-full truncate rounded-xl bg-white/88 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-sky-200 backdrop-blur">
            <span className="font-semibold text-slate-900">City Grid</span> - Google Maps - live overlays
          </div>
          <div className="rounded-xl bg-emerald-400/15 px-3 py-2 text-[11px] text-emerald-900 ring-1 ring-emerald-500/25 backdrop-blur">
            Route AI Online
          </div>
        </div>
      </div>
    </div>
  )
}
