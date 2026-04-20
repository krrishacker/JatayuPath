import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronRight, History, Home, Loader2, LogOut, MapPin, Menu, Moon, Route, ScanLine, Settings, SunMedium, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LiveCameraFeed, { type LiveCameraFeedHandle } from '../components/LiveCameraFeed'
import WifiCameraFeed from '../components/WifiCameraFeed'
import SmartMapView, { type LatLng, type MapPlace } from '../components/SmartMapView'
import { fetchNearestHospitals, fetchRoadRoutes, geocodeAddress, geocodePlaceId, reverseGeocodeLocation, searchAddressSuggestions, type AddressSuggestion, type HospitalPlace, type RoadRoute } from '../lib/osm'
import { appendViolationEvidence, getViolationEvidence, type ViolationEvidence } from '../lib/violationEvidence'
import { setActiveEmergencyVehicle } from '../lib/activeEmergency'
import { appendPotholeEvidence } from '../lib/potholeEvidence'
import { getPatientCabinCameraConfig } from '../lib/cameraConfig'

type DriverView = 'home' | 'profile' | 'analytics'
type ThemeMode = 'night' | 'day'
type RouteMode = 'best' | 'shortest'
type EmergencyVehicle = 'Ambulance' | 'Fire Brigade' | 'Police Vehicle'
type DestinationMode = 'hospital' | 'manual'
type DestinationState = { label: string; position: LatLng } | null

const quickMenu = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'analytics', label: 'AI Analytics', icon: Route },
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
] as const

const initialNotifications = [
  { id: 'nf-1', title: 'Driver mode ready', message: 'GPS, route guidance, and evidence capture are available from the home screen.' },
  { id: 'nf-2', title: 'Tip', message: 'Ambulance mode shows top nearby hospitals and manual destination suggestions together.' },
]

function formatEta(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--'
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return '--'
  return `${(meters / 1000).toFixed(1)} km`
}

export default function DriverDashboardPage() {
  const nav = useNavigate()
  const dashCameraRef = useRef<LiveCameraFeedHandle>(null)
  const captureModeRef = useRef<'violation' | 'pothole'>('violation')
  const watchIdRef = useRef<number | null>(null)
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null)
  const hospitalsAbortRef = useRef<AbortController | null>(null)
  const routeAbortRef = useRef<AbortController | null>(null)
  const suggestionAbortRef = useRef<AbortController | null>(null)
  const defaultCenter = useMemo<LatLng>(() => ({ lat: 28.4595, lng: 77.0266 }), [])

  const [view, setView] = useState<DriverView>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('night')
  const [vehicleType, setVehicleType] = useState<EmergencyVehicle>('Ambulance')
  const [routeMode, setRouteMode] = useState<RouteMode>('best')
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('hospital')

  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null)
  const [liveAddress, setLiveAddress] = useState('Waiting for live GPS...')
  const [statusLine, setStatusLine] = useState('Allow location access to start live tracking.')
  const [locationReady, setLocationReady] = useState(false)
  const [manualDestinationInput, setManualDestinationInput] = useState('')
  const [manualDestination, setManualDestination] = useState<DestinationState>(null)
  const [manualDestinationLoading, setManualDestinationLoading] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false)
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [nearestHospitals, setNearestHospitals] = useState<HospitalPlace[]>([])
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)
  const [hospitalLoading, setHospitalLoading] = useState(false)
  const [routeOptions, setRouteOptions] = useState<RoadRoute[]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [capturedPlates, setCapturedPlates] = useState<ViolationEvidence[]>([])
  const [notifications, setNotifications] = useState(initialNotifications)

  const activeDestination = useMemo<DestinationState>(() => {
    if (vehicleType === 'Ambulance') {
      if (destinationMode === 'manual' && manualDestination) return manualDestination
      const hospital = nearestHospitals.find((item) => item.id === selectedHospitalId) ?? nearestHospitals[0]
      return hospital ? { label: hospital.name, position: hospital.position } : null
    }
    return manualDestination
  }, [destinationMode, manualDestination, nearestHospitals, selectedHospitalId, vehicleType])

  const activeRoute = useMemo(() => {
    if (routeOptions.length === 0) return null
    const sortedByDuration = [...routeOptions].sort((a, b) => a.durationSeconds - b.durationSeconds)
    const sortedByDistance = [...routeOptions].sort((a, b) => a.distanceMeters - b.distanceMeters)
    return routeMode === 'best' ? sortedByDuration[0] : sortedByDistance[0]
  }, [routeMode, routeOptions])

  const mapCenter = currentLocation ?? activeDestination?.position ?? defaultCenter
  const routeLabel = routeMode === 'best' ? 'Fastest Road Route' : 'Shortest Road Route'
  const eta = activeRoute ? formatEta(activeRoute.durationSeconds) : '--'
  const routeDistance = activeRoute ? formatDistance(activeRoute.distanceMeters) : '--'
  const patientCabinCamera = useMemo(() => getPatientCabinCameraConfig(), [])
  const hospitalMarkers: MapPlace[] =
    vehicleType === 'Ambulance'
      ? nearestHospitals.map((hospital) => ({
          id: hospital.id,
          label: hospital.name,
          position: hospital.position,
          kind: 'hospital',
        }))
      : []

  function handleLocationUpdate(position: GeolocationPosition) {
    const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude }
    setCurrentLocation(nextLocation)
    setLocationReady(true)
    setStatusLine('Live GPS connected. Updating map and route.')
  }

  function syncEvidence() {
    setCapturedPlates(getViolationEvidence().slice(0, 12))
  }

  function pushNotification(title: string, message: string) {
    setNotifications((prev) => [{ id: crypto.randomUUID(), title, message }, ...prev].slice(0, 10))
  }

  function clearTracking() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  function describeLocationError(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission denied. Allow GPS access in the browser and reload the dashboard.'
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'Location signal unavailable. Move to an open area, enable device location, and retry.'
    }
    if (error.code === error.TIMEOUT) {
      return 'Location request timed out. Retrying with standard GPS accuracy.'
    }
    return 'Location error. Retry using Refresh GPS.'
  }

  function cleanupNetworkRequests() {
    reverseGeocodeAbortRef.current?.abort()
    hospitalsAbortRef.current?.abort()
    routeAbortRef.current?.abort()
    suggestionAbortRef.current?.abort()
  }

  async function refreshHospitals(location: LatLng) {
    if (vehicleType !== 'Ambulance') {
      setNearestHospitals([])
      return
    }

    hospitalsAbortRef.current?.abort()
    const controller = new AbortController()
    hospitalsAbortRef.current = controller
    setHospitalLoading(true)

    try {
      const hospitals = await fetchNearestHospitals(location, controller.signal)
      if (controller.signal.aborted) return
      setNearestHospitals(hospitals)
      setSelectedHospitalId((current) => current ?? hospitals[0]?.id ?? null)
      if (destinationMode !== 'manual') setDestinationMode('hospital')
      setStatusLine(hospitals[0] ? `Nearest hospital loaded: ${hospitals[0].name}.` : 'No nearby hospitals found from Google Maps.')
    } catch (error) {
      if (controller.signal.aborted) return
      setNearestHospitals([])
      setStatusLine('Hospital search failed. Try refreshing GPS.')
      pushNotification('Hospital lookup failed', error instanceof Error ? error.message : 'Google Places hospital lookup failed.')
    } finally {
      if (!controller.signal.aborted) setHospitalLoading(false)
    }
  }

  async function refreshRoute(start: LatLng, destination: DestinationState) {
    if (!destination) {
      setRouteOptions([])
      return
    }

    routeAbortRef.current?.abort()
    const controller = new AbortController()
    routeAbortRef.current = controller
    setRouteLoading(true)

    try {
      const routes = await fetchRoadRoutes(start, destination.position, controller.signal)
      if (controller.signal.aborted) return
      setRouteOptions(routes)
      setStatusLine(routes[0] ? `Road route ready to ${destination.label}.` : 'No drivable road route found for this destination.')
    } catch (error) {
      if (controller.signal.aborted) return
      setRouteOptions([])
      setStatusLine('Route service unavailable right now.')
      pushNotification('Routing failed', error instanceof Error ? error.message : 'Google Directions route lookup failed.')
    } finally {
      if (!controller.signal.aborted) setRouteLoading(false)
    }
  }

  async function updateLiveAddress(location: LatLng) {
    reverseGeocodeAbortRef.current?.abort()
    const controller = new AbortController()
    reverseGeocodeAbortRef.current = controller
    setLiveAddress('Resolving your live location...')

    try {
      const address = await reverseGeocodeLocation(location, controller.signal)
      if (!controller.signal.aborted) {
        setLiveAddress(address || 'Current area available')
      }
    } catch {
      if (!controller.signal.aborted) {
        setLiveAddress('Current area available')
      }
    }
  }

  async function startLocationTracking() {
    if (!navigator.geolocation) {
      setStatusLine('Geolocation is not supported in this browser.')
      pushNotification('Location unavailable', 'Browser Geolocation API is not available.')
      return
    }

    if (!window.isSecureContext) {
      setLocationReady(false)
      setStatusLine('GPS requires a secure context. Open the app on localhost or HTTPS and retry.')
      pushNotification('GPS blocked', 'Browser geolocation only works on localhost or HTTPS.')
      return
    }

    clearTracking()
    setStatusLine('Waiting for live GPS permission...')

    const requestCurrentPosition = (enableHighAccuracy: boolean) =>
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationUpdate(position)
        },
        (error) => {
          if (enableHighAccuracy && error.code !== error.PERMISSION_DENIED) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                handleLocationUpdate(position)
              },
              (fallbackError) => {
                const message = describeLocationError(fallbackError)
                setLocationReady(false)
                setStatusLine(message)
                pushNotification('GPS update failed', message)
              },
              { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
            )
            return
          }

          const message = describeLocationError(error)
          setLocationReady(false)
          setStatusLine(message)
          pushNotification('GPS update failed', message)
        },
        { enableHighAccuracy, timeout: enableHighAccuracy ? 12000 : 20000, maximumAge: enableHighAccuracy ? 0 : 60000 },
      )

    requestCurrentPosition(true)

    // watchPosition keeps the map marker and route synced with the moving vehicle.
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handleLocationUpdate(position)
      },
      (error) => {
        const message = describeLocationError(error)
        setLocationReady(false)
        setStatusLine(message)
        pushNotification('GPS update failed', message)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    )
  }

  async function selectManualSuggestion(suggestion: AddressSuggestion) {
    setManualDestinationLoading(true)
    setShowAddressSuggestions(false)
    setStatusLine(`Resolving destination for ${vehicleType.toLowerCase()}...`)

    try {
      const resolvedDestination = suggestion.position
        ? { label: suggestion.label, position: suggestion.position }
        : suggestion.placeId
          ? await geocodePlaceId(suggestion.placeId)
          : await geocodeAddress(suggestion.label)

      setManualDestination(resolvedDestination)
      setManualDestinationInput(resolvedDestination.label)
      setDestinationMode('manual')
      setStatusLine(`Destination set for ${vehicleType}: ${resolvedDestination.label}.`)
      pushNotification('Destination updated', `${vehicleType} destination was resolved successfully.`)
    } catch (error) {
      setManualDestination(null)
      setStatusLine('Unable to resolve that address. Try a clearer landmark or full address.')
      pushNotification('Destination lookup failed', error instanceof Error ? error.message : 'Address search failed.')
    } finally {
      setManualDestinationLoading(false)
    }
  }

  async function submitManualDestination() {
    const query = manualDestinationInput.trim()
    if (!query) {
      setStatusLine('Enter an address before creating a route.')
      return
    }

    const exactSuggestion = addressSuggestions.find((suggestion) => suggestion.label.trim().toLowerCase() === query.toLowerCase())
    if (exactSuggestion) {
      await selectManualSuggestion(exactSuggestion)
      return
    }

    setManualDestinationLoading(true)
    setStatusLine(`Searching destination for ${vehicleType.toLowerCase()}...`)

    try {
      const resolvedDestination = await geocodeAddress(query)
      setManualDestination(resolvedDestination)
      setManualDestinationInput(resolvedDestination.label)
      setDestinationMode('manual')
      setShowAddressSuggestions(false)
      setStatusLine(`Destination set for ${vehicleType}: ${resolvedDestination.label}.`)
      pushNotification('Destination updated', `${vehicleType} destination was resolved successfully.`)
    } catch (error) {
      setManualDestination(null)
      setStatusLine('Unable to resolve that address. Try a clearer landmark or full address.')
      pushNotification('Destination lookup failed', error instanceof Error ? error.message : 'Address search failed.')
    } finally {
      setManualDestinationLoading(false)
    }
  }

  function capturePlate(image: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    appendViolationEvidence({
      id: crypto.randomUUID(),
      image,
      time,
      source: 'Driver Camera',
      note: `Captured from ${vehicleType} route and forwarded to traffic control for legal action.`,
    })
    syncEvidence()
    pushNotification('Image captured', `Evidence saved at ${time} and forwarded to traffic control.`)
  }

  function capturePothole(image: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    appendPotholeEvidence({
      id: crypto.randomUUID(),
      image,
      time,
      source: 'Driver Camera',
      note: `Pothole captured from ${vehicleType} route for road authority dispatch.`,
    })
    pushNotification('Pothole captured', `Road authority report saved at ${time}.`)
  }

  function handleDashCapture(image: string) {
    if (captureModeRef.current === 'pothole') {
      capturePothole(image)
      captureModeRef.current = 'violation'
      return
    }
    capturePlate(image)
  }

  function sendSos() {
    const destinationLabel = activeDestination?.label ?? 'control room only'
    setStatusLine(`${vehicleType} SOS sent with current live location and destination ${destinationLabel}.`)
    pushNotification('SOS sent', `${vehicleType} emergency alert dispatched to the traffic control room.`)
  }

  useEffect(() => {
    syncEvidence()
    void startLocationTracking()
    return () => {
      clearTracking()
      cleanupNetworkRequests()
    }
  }, [])

  useEffect(() => {
    if (!currentLocation) return

    const timeoutId = window.setTimeout(() => {
      void updateLiveAddress(currentLocation)
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [currentLocation])

  useEffect(() => {
    if (!currentLocation) return
    if (vehicleType === 'Ambulance') {
      void refreshHospitals(currentLocation)
      return
    }
    setNearestHospitals([])
    setSelectedHospitalId(null)
  }, [currentLocation, destinationMode, vehicleType])

  useEffect(() => {
    if (!currentLocation || !activeDestination) {
      setRouteOptions([])
      return
    }
    void refreshRoute(currentLocation, activeDestination)
  }, [activeDestination, currentLocation])

  useEffect(() => {
    if (!currentLocation) return

    setActiveEmergencyVehicle({
      id: 'DRV-01',
      vehicleType,
      liveLocation: currentLocation,
      liveAddress,
      destinationLabel: activeDestination?.label ?? null,
      destinationPosition: activeDestination?.position ?? null,
      etaMinutes: activeRoute ? Math.max(1, Math.round(activeRoute.durationSeconds / 60)) : null,
      updatedAt: new Date().toISOString(),
    })
  }, [activeDestination, activeRoute, currentLocation, liveAddress, vehicleType])

  useEffect(() => {
    if (vehicleType === 'Ambulance') {
      setDestinationMode('hospital')
      return
    }
    setManualDestination(null)
    setSelectedHospitalId(null)
    setShowAddressSuggestions(false)
    setRouteOptions([])
    setStatusLine(`Enter the ${vehicleType.toLowerCase()} destination address to generate a road route.`)
  }, [vehicleType])

  useEffect(() => {
    const query = manualDestinationInput.trim()
    if (query.length < 3) {
      suggestionAbortRef.current?.abort()
      setAddressSuggestions([])
      setAddressSuggestionsLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      suggestionAbortRef.current?.abort()
      const controller = new AbortController()
      suggestionAbortRef.current = controller
      setAddressSuggestionsLoading(true)

      try {
        const suggestions = await searchAddressSuggestions(query, controller.signal)
        if (controller.signal.aborted) return
        setAddressSuggestions(suggestions)
      } catch {
        if (controller.signal.aborted) return
        setAddressSuggestions([])
      } finally {
        if (!controller.signal.aborted) setAddressSuggestionsLoading(false)
      }
    }, 280)

    return () => window.clearTimeout(timeoutId)
  }, [manualDestinationInput])

  const shellCls =
    theme === 'night'
      ? 'bg-[radial-gradient(900px_circle_at_10%_0%,rgba(34,211,238,.18),transparent_40%),radial-gradient(900px_circle_at_90%_10%,rgba(251,146,60,.12),transparent_35%),linear-gradient(180deg,#08111f_0%,#0b1220_45%,#0f172a_100%)] text-white'
      : 'bg-[radial-gradient(900px_circle_at_10%_0%,rgba(14,165,233,.18),transparent_40%),radial-gradient(900px_circle_at_90%_10%,rgba(249,115,22,.12),transparent_35%),linear-gradient(180deg,#e0f2fe_0%,#f8fafc_45%,#eef2ff_100%)] text-slate-950'
  const cardCls =
    theme === 'night'
      ? 'border-white/10 bg-white/6 text-white shadow-2xl shadow-cyan-950/20'
      : 'border-slate-200/70 bg-white/80 text-slate-950 shadow-xl shadow-sky-200/30'
  const mutedCls = theme === 'night' ? 'text-slate-400' : 'text-slate-500'
  const softPanelCls = theme === 'night' ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
  const pillCls = theme === 'night' ? 'bg-white/8 text-white/80 ring-white/10' : 'bg-slate-100 text-slate-700 ring-slate-200'

  function renderAutocomplete(placeholder: string) {
    return (
      <div className="relative mt-3">
        <input
          value={manualDestinationInput}
          onChange={(event) => {
            setManualDestinationInput(event.target.value)
            setShowAddressSuggestions(true)
          }}
          onFocus={() => setShowAddressSuggestions(true)}
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void submitManualDestination()
            }
            if (event.key === 'Escape') {
              setShowAddressSuggestions(false)
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${theme === 'night' ? 'border-white/10 bg-white/6 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400'}`}
          style={{
            color: theme === 'night' ? '#ffffff' : '#020617',
            caretColor: theme === 'night' ? '#ffffff' : '#020617',
            WebkitTextFillColor: theme === 'night' ? '#ffffff' : '#020617',
            backgroundColor: theme === 'night' ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
          }}
        />

        {showAddressSuggestions && (manualDestinationInput.trim().length >= 3 || addressSuggestions.length > 0) ? (
          <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-2xl border p-2 ${theme === 'night' ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white'} shadow-2xl`}>
            {addressSuggestionsLoading ? (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${mutedCls}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching addresses...
              </div>
            ) : null}

            {!addressSuggestionsLoading &&
              addressSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => void selectManualSuggestion(suggestion)}
                  className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition ${theme === 'night' ? 'hover:bg-white/8' : 'hover:bg-slate-100'}`}
                >
                  <div className="font-medium">{suggestion.label}</div>
                </button>
              ))}

            {!addressSuggestionsLoading && addressSuggestions.length > 0 ? (
              <button
                type="button"
                onClick={() => void submitManualDestination()}
                className={`mt-1 block w-full rounded-xl border px-3 py-3 text-left text-sm transition ${theme === 'night' ? 'border-white/10 bg-white/5 hover:bg-white/8' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="font-medium">Use typed address</div>
                <div className={`mt-1 text-xs ${mutedCls}`}>{manualDestinationInput.trim()}</div>
              </button>
            ) : null}

            {!addressSuggestionsLoading && addressSuggestions.length === 0 && manualDestinationInput.trim().length >= 3 ? (
              <button
                type="button"
                onClick={() => void submitManualDestination()}
                className={`rounded-xl px-3 py-3 text-left text-sm transition ${theme === 'night' ? 'hover:bg-white/8' : 'hover:bg-slate-100'}`}
              >
                <div className="font-medium">Search this address</div>
                <div className={`mt-1 text-xs ${mutedCls}`}>{manualDestinationInput.trim()}</div>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  function renderDestinationPanel() {
    if (vehicleType === 'Ambulance') {
      return (
        <div className="space-y-4">
          <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
            <div className={`flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] ${mutedCls}`}>
              <span>Nearest Hospitals</span>
              <span className={`ml-auto text-[10px] tracking-[0.2em] ${mutedCls}`}>Suggested from live GPS</span>
              {hospitalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>
            <div className={`mt-2 text-sm ${mutedCls}`}>
              {liveAddress === 'Waiting for live GPS...' || liveAddress === 'Resolving your live location...'
                ? 'Finding nearby hospitals from your live location...'
                : `Available near ${liveAddress}`}
            </div>
            <div className="mt-3 grid gap-3">
              {nearestHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  type="button"
                  onClick={() => {
                    setSelectedHospitalId(hospital.id)
                    setDestinationMode('hospital')
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    destinationMode === 'hospital' && selectedHospitalId === hospital.id
                      ? 'border-cyan-300 bg-cyan-400/15'
                      : theme === 'night'
                        ? 'border-white/10 bg-white/5 hover:bg-white/10'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-semibold">{hospital.name}</div>
                  <div className={`mt-1 text-xs ${mutedCls}`}>{hospital.address ?? 'Address not available'}</div>
                  <div className={`mt-2 text-xs ${mutedCls}`}>Suggested nearby hospital • {hospital.distanceKm.toFixed(1)} km away</div>
                </button>
              ))}
              {!hospitalLoading && nearestHospitals.length === 0 ? (
                <div className={`rounded-2xl border px-4 py-5 text-sm ${softPanelCls}`}>No hospital suggestions yet. Keep GPS on and try Refresh GPS.</div>
              ) : null}
            </div>
          </div>

          <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Manual Destination Search</div>
            {renderAutocomplete('Search any hospital or emergency destination')}
            <button
              type="button"
              onClick={() => void submitManualDestination()}
              disabled={manualDestinationLoading}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {manualDestinationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Use Manual Destination
            </button>
            <div className={`mt-3 text-sm ${mutedCls}`}>
              {destinationMode === 'manual' && manualDestination ? manualDestination.label : 'Choose a nearby hospital or search manually.'}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
        <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Destination Address</div>
        {renderAutocomplete(vehicleType === 'Fire Brigade' ? 'Enter fire incident address' : 'Enter police emergency address')}
        <button
          type="button"
          onClick={() => void submitManualDestination()}
          disabled={manualDestinationLoading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {manualDestinationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Set Road Route
        </button>
        <div className={`mt-3 text-sm ${mutedCls}`}>{manualDestination?.label ?? 'Destination not selected'}</div>
      </div>
    )
  }

  function renderHome() {
    return (
      <div className="space-y-6">
        <section className={`overflow-hidden rounded-[32px] border ${cardCls}`}>
          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-xl font-semibold">Driver Home</div>
              <div className={`mt-1 text-sm ${mutedCls}`}>Live GPS, Google Maps destination discovery, and road-based routing tuned for emergency driving.</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void startLocationTracking()}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <MapPin className="h-4 w-4" />
                Refresh GPS
              </button>
              <button
                type="button"
                onClick={sendSos}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                <ChevronRight className="h-4 w-4" />
                Send SOS
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <SmartMapView
              center={mapCenter}
              zoom={13}
              className="h-[320px] w-full sm:h-[380px] lg:h-[430px]"
              ambulances={currentLocation ? [{ id: 'DRV-01', position: currentLocation, status: locationReady ? 'enroute' : 'idle' }] : []}
              destination={activeDestination ?? undefined}
              route={activeRoute?.geometry ?? []}
              places={hospitalMarkers}
              followPosition={currentLocation}
            />
            <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ring-1 ${theme === 'night' ? 'bg-cyan-400/10 text-cyan-50 ring-cyan-400/15' : 'bg-sky-50 text-slate-700 ring-sky-200'}`}>
              {statusLine}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div className={`min-w-0 rounded-[32px] border p-5 ${cardCls}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Live Address</div>
                <div className="mt-3 text-base font-semibold leading-6">{liveAddress}</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Route Summary</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedCls}>Mode</span>
                    <span className="font-semibold">{routeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedCls}>ETA</span>
                    <span className="font-semibold">{routeLoading ? 'Calculating...' : eta}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={mutedCls}>Distance</span>
                    <span className="font-semibold">{routeLoading ? 'Calculating...' : routeDistance}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {renderDestinationPanel()}

              <div className="space-y-4">
                <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                  <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Route Option</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(['best', 'shortest'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRouteMode(mode)}
                        className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                          routeMode === mode
                            ? 'bg-cyan-400 text-slate-950'
                            : theme === 'night'
                              ? 'bg-white/8 text-white/75 ring-1 ring-white/10'
                              : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        {mode === 'best' ? 'Fastest' : 'Shortest'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                  <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Emergency Vehicle</div>
                  <div className="mt-3 grid gap-2">
                    {(['Ambulance', 'Fire Brigade', 'Police Vehicle'] as const).map((vehicle) => (
                      <button
                        key={vehicle}
                        type="button"
                        onClick={() => setVehicleType(vehicle)}
                        className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                          vehicleType === vehicle
                            ? 'bg-amber-300 text-slate-950'
                            : theme === 'night'
                              ? 'bg-white/8 text-white/75 ring-1 ring-white/10'
                              : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        {vehicle}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className={`rounded-[32px] border p-5 ${cardCls}`}>
              <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Quick Actions</div>
              <div className="mt-4 grid gap-4">
                <button
                  type="button"
                  onClick={sendSos}
                  className="flex items-center justify-between gap-4 rounded-3xl bg-rose-500 px-5 py-4 text-left text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400"
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold">Send SOS Now</div>
                    <div className="mt-1 text-sm text-rose-100/90">Send live GPS and active destination to control room for corridor clearance.</div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    captureModeRef.current = 'violation'
                    dashCameraRef.current?.captureFrame()
                  }}
                  className="flex items-center justify-between gap-4 rounded-3xl bg-amber-300 px-5 py-4 text-left text-slate-950 shadow-lg shadow-amber-300/20 transition hover:bg-amber-200"
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold">Capture Dash Evidence</div>
                    <div className="mt-1 text-sm text-slate-700">Capture the road-facing feed for evidence and route incidents.</div>
                  </div>
                  <ScanLine className="h-5 w-5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    captureModeRef.current = 'pothole'
                    dashCameraRef.current?.captureFrame()
                  }}
                  className="flex items-center justify-between gap-4 rounded-3xl bg-emerald-300 px-5 py-4 text-left text-slate-950 shadow-lg shadow-emerald-300/20 transition hover:bg-emerald-200"
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold">Capture Pothole</div>
                    <div className="mt-1 text-sm text-emerald-900">Send a road hazard snapshot to the road authority queue.</div>
                  </div>
                  <ScanLine className="h-5 w-5 shrink-0" />
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              <div className={`overflow-hidden rounded-[32px] border ${cardCls}`}>
                <LiveCameraFeed
                  ref={dashCameraRef}
                  label="Dash Camera"
                  preferredCamera="internal"
                  captureLabel="Capture dash"
                  onCapture={handleDashCapture}
                />
              </div>
              {vehicleType === 'Ambulance' ? (
                <div className={`overflow-hidden rounded-[32px] border ${cardCls}`}>
                  <WifiCameraFeed
                    label="Patient Cabin Wi-Fi Camera"
                    url={patientCabinCamera.url}
                    streamUrl={patientCabinCamera.streamUrl}
                    controlUrl={patientCabinCamera.controlUrl}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    )
  }

  function renderAnalytics() {
    return (
      <div className="space-y-6">
        <section className={`rounded-[32px] border p-6 ${cardCls}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Driver Analytics</div>
              <div className="mt-2 text-2xl font-semibold">AI Route Intelligence</div>
              <div className={`mt-2 text-sm ${mutedCls}`}>Operational scores and risk signals for the current emergency run.</div>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm ring-1 ${pillCls}`}>
              <Route className="mr-2 inline h-4 w-4" />
              {routeLabel}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className={`rounded-[32px] border p-5 ${cardCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Route Confidence</div>
            <div className="mt-4 text-3xl font-semibold">94.8%</div>
            <div className={`mt-3 text-sm ${mutedCls}`}>Prediction quality for the current road corridor.</div>
          </div>
          <div className={`rounded-[32px] border p-5 ${cardCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Clearance Score</div>
            <div className="mt-4 text-3xl font-semibold">8.7/10</div>
            <div className={`mt-3 text-sm ${mutedCls}`}>AI-estimated chance of maintaining a clean lane.</div>
          </div>
          <div className={`rounded-[32px] border p-5 ${cardCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Risk Watch</div>
            <div className="mt-4 text-3xl font-semibold">{capturedPlates.length}</div>
            <div className={`mt-3 text-sm ${mutedCls}`}>Recent evidence captures flagged for corridor review.</div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className={`rounded-[32px] border p-5 ${cardCls}`}>
            <div className="text-lg font-semibold">Live Route Snapshot</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${mutedCls}`}>Current Location</div>
                <div className="mt-3 text-base font-semibold leading-6">{liveAddress}</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${mutedCls}`}>Destination</div>
                <div className="mt-3 text-base font-semibold leading-6">{activeDestination?.label ?? 'Destination pending'}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${mutedCls}`}>ETA</div>
                <div className="mt-3 text-2xl font-semibold">{eta}</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${mutedCls}`}>Distance</div>
                <div className="mt-3 text-2xl font-semibold">{routeDistance}</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${mutedCls}`}>Vehicle</div>
                <div className="mt-3 text-2xl font-semibold">{vehicleType}</div>
              </div>
            </div>
          </div>

          <div className={`rounded-[32px] border p-5 ${cardCls}`}>
            <div className="text-lg font-semibold">AI Recommendations</div>
            <div className="mt-4 space-y-3">
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className="text-sm font-semibold">Maintain fastest corridor</div>
                <div className={`mt-2 text-sm ${mutedCls}`}>Current traffic pattern still favors the fastest route mode.</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className="text-sm font-semibold">Keep evidence capture ready</div>
                <div className={`mt-2 text-sm ${mutedCls}`}>Dash camera should stay active through dense intersections and bottlenecks.</div>
              </div>
              <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
                <div className="text-sm font-semibold">Monitor patient cabin feed</div>
                <div className={`mt-2 text-sm ${mutedCls}`}>Cabin camera is available for remote visibility during live transport.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  function renderProfile() {
    return (
      <div className={`rounded-[32px] border p-6 ${cardCls}`}>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-cyan-400 text-xl font-semibold text-slate-950">AS</div>
          <div>
            <div className="text-2xl font-semibold">Aarav Singh</div>
            <div className={`mt-1 text-sm ${mutedCls}`}>Emergency Driver - Shift Alpha</div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Vehicle</div>
            <div className="mt-3 text-lg font-semibold">{vehicleType}</div>
          </div>
          <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Current Route</div>
            <div className="mt-3 text-lg font-semibold">{routeLabel}</div>
          </div>
          <div className={`rounded-3xl border p-4 ${softPanelCls}`}>
            <div className={`text-xs uppercase tracking-[0.25em] ${mutedCls}`}>Evidence History</div>
            <div className="mt-3 text-lg font-semibold">{capturedPlates.length} saved</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors ${shellCls}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl overflow-x-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] flex-col overflow-y-auto border-r transition ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${theme === 'night' ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'} p-6 backdrop-blur`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-400">Driver Menu</div>
              <div className="mt-2 truncate text-2xl font-semibold">Emergency Route AI</div>
            </div>
            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-2xl p-2">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {quickMenu.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setView(item.key)
                  setMenuOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${
                  view === item.key
                    ? 'bg-cyan-400 text-slate-950'
                    : theme === 'night'
                      ? 'bg-white/5 text-white/80 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                setHistoryOpen(true)
                setMenuOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${
                theme === 'night' ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="h-5 w-5" />
              Capture History
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
              className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${
                theme === 'night' ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {theme === 'night' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              Theme
            </button>
            <button
              type="button"
              onClick={() => {
                setView('profile')
                setMenuOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${
                theme === 'night' ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Settings className="h-5 w-5" />
              Profile and Settings
            </button>
          </div>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => nav('/login')}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-rose-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        {menuOpen ? <button type="button" className="fixed inset-0 z-30 bg-slate-950/45" onClick={() => setMenuOpen(false)} /> : null}

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="sticky top-0 z-20 border-b border-white/10 bg-inherit/80 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-white/70'}`}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-400">Driver Dashboard</div>
                  <div className="mt-1 truncate text-2xl font-semibold">
                    {view === 'home' ? 'Live Emergency Route' : view === 'analytics' ? 'AI Analytics' : 'Profile'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`hidden max-w-[220px] truncate rounded-full px-4 py-2 text-sm ring-1 md:inline-flex ${pillCls}`}>
                  <Route className="mr-2 h-4 w-4 shrink-0" />
                  {routeLabel}
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme === 'night' ? 'border-white/10 bg-white/6 text-white' : 'border-slate-200 bg-white/70 text-slate-950'}`}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-hidden px-4 py-6 sm:px-6">
            {view === 'home' ? renderHome() : view === 'analytics' ? renderAnalytics() : renderProfile()}
          </div>
        </main>
      </div>

      {notificationsOpen ? (
        <div className="fixed right-4 top-24 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
          <div className={`overflow-hidden rounded-[28px] border ${cardCls} notif-pop`}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold">Notifications</div>
                <div className={`mt-1 text-sm ${mutedCls}`}>Important updates for the driver.</div>
              </div>
              <button type="button" onClick={() => setNotificationsOpen(false)} className={`rounded-2xl px-3 py-2 text-sm ring-1 ${pillCls}`}>
                Close
              </button>
            </div>
            <div className="max-h-[min(60vh,420px)] space-y-3 overflow-y-auto p-4">
              {notifications.map((item) => (
                <div key={item.id} className={`${theme === 'night' ? 'bg-white/5' : 'bg-slate-50'} rounded-3xl border border-white/10 p-4`}>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className={`mt-1 text-sm ${mutedCls}`}>{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-4 sm:place-items-center">
          <div className={`h-[80vh] w-full max-w-3xl overflow-hidden rounded-[32px] border ${cardCls}`}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold">Capture History</div>
                <div className={`mt-1 text-sm ${mutedCls}`}>Saved images from the dash and patient cabin cameras.</div>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} className={`rounded-2xl px-4 py-2 text-sm ring-1 ${pillCls}`}>
                Close
              </button>
            </div>
            <div className="grid max-h-[calc(80vh-88px)] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {capturedPlates.map((item) => (
                <div key={item.id} className={`overflow-hidden rounded-[28px] border ${softPanelCls}`}>
                  <img src={item.image} alt={`Captured evidence ${item.time}`} className="h-52 w-full object-cover" />
                  <div className="space-y-2 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{item.source}</span>
                      <span className={mutedCls}>{item.time}</span>
                    </div>
                    <div className={mutedCls}>{item.note}</div>
                  </div>
                </div>
              ))}
              {capturedPlates.length === 0 ? (
                <div className={`col-span-full rounded-[28px] border px-5 py-8 text-center ${softPanelCls}`}>
                  No images captured yet. Use Capture Number Plate when you need legal evidence.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
