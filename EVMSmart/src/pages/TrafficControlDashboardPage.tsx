import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  CheckCircle2,
  FileWarning,
  LayoutGrid,
  LogOut,
  Pencil,
  Siren,
  Sparkles,
  TrafficCone,
  Waves,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SmartMapView, { type LatLng, type MapAmbulance, type MapCamera, type MapCongestion } from '../components/SmartMapView'
import EmergencyRoutePanel, { type ActiveRoute } from '../components/EmergencyRoutePanel'
import ViolationCard, { type Violation } from '../components/ViolationCard'
import { getViolationEvidence, type ViolationEvidence, VIOLATION_EVIDENCE_EVENT } from '../lib/violationEvidence'
import { ACTIVE_EMERGENCY_EVENT, getActiveEmergencyVehicle, type SharedEmergencyVehicle } from '../lib/activeEmergency'

type IncomingRequest = {
  id: string
  ambulanceId: string
  location: string
  destination: string
  priority: 'critical' | 'high' | 'standard'
}

type TrafficView = 'overview' | 'requests' | 'corridors' | 'monitoring' | 'analytics' | 'evidence'

function priorityCls(priority: IncomingRequest['priority']) {
  if (priority === 'critical') return 'bg-rose-500/12 text-rose-200 ring-rose-500/25'
  if (priority === 'high') return 'bg-amber-500/12 text-amber-200 ring-amber-500/25'
  return 'bg-cyan-500/12 text-cyan-200 ring-cyan-500/25'
}

const commandTabs = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'requests', label: 'SOS Queue', icon: Siren },
  { key: 'corridors', label: 'Corridors', icon: TrafficCone },
  { key: 'monitoring', label: 'AI Monitor', icon: Sparkles },
  { key: 'analytics', label: 'AI Analytics', icon: Activity },
  { key: 'evidence', label: 'Evidence', icon: FileWarning },
] as const

export default function TrafficControlDashboardPage() {
  const nav = useNavigate()
  const center = useMemo<LatLng>(() => ({ lat: 28.4595, lng: 77.0266 }), [])
  const [activeView, setActiveView] = useState<TrafficView>('overview')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [requests, setRequests] = useState<IncomingRequest[]>([
    { id: 'R-201', ambulanceId: 'A-12', location: 'IFFCO Chowk', destination: 'Medanta Hospital', priority: 'critical' },
    { id: 'R-202', ambulanceId: 'A-07', location: 'Cyber Hub', destination: 'Artemis Hospital', priority: 'high' },
    { id: 'R-203', ambulanceId: 'A-19', location: 'Golf Course Rd', destination: 'Fortis Memorial', priority: 'standard' },
  ])
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[]>([
    { id: 'ER-12', ambulanceId: 'A-12', from: 'IFFCO Chowk', to: 'Medanta Hospital', etaMin: 11, corridor: 'GREEN' },
    { id: 'ER-07', ambulanceId: 'A-07', from: 'Cyber Hub', to: 'Artemis Hospital', etaMin: 14, corridor: 'YELLOW' },
  ])
  const [notifications, setNotifications] = useState([
    { id: 'tn-1', title: 'Congestion spike', message: 'NH-48 ramp density is rising. Consider corridor rebalancing.' },
    { id: 'tn-2', title: 'Signal sync ready', message: 'MG Road signal priority can be pushed for the next emergency run.' },
  ])
  const [evidence, setEvidence] = useState<ViolationEvidence[]>([])
  const [sharedVehicle, setSharedVehicle] = useState<SharedEmergencyVehicle | null>(null)

  const monitoringCases = useMemo<Violation[]>(
    () => [
      {
        id: 'v1',
        vehicleNumber: 'HR26AB1234',
        violation: 'Emergency lane blocking',
        time: '14:32',
        status: 'violation',
        cameraLabel: 'Cam 08 • MG Rd',
      },
      {
        id: 'v2',
        vehicleNumber: 'DL3CAP9081',
        violation: 'Signal jumping in priority corridor',
        time: '14:28',
        status: 'review',
        cameraLabel: 'Cam 11 • Link Rd',
      },
      {
        id: 'v3',
        vehicleNumber: 'HR98QW4450',
        violation: 'Lane cleared',
        time: '14:22',
        status: 'clear',
        cameraLabel: 'Cam 03 • Ring',
      },
    ],
    [],
  )

  const ambulances = useMemo<MapAmbulance[]>(
    () => {
      const base: MapAmbulance[] = [
        { id: 'A-12', position: { lat: 28.4629, lng: 77.0289 }, status: 'enroute' },
        { id: 'A-07', position: { lat: 28.465, lng: 77.0218 }, status: 'enroute' },
        { id: 'A-19', position: { lat: 28.4548, lng: 77.0192 }, status: 'idle' },
      ]

      if (sharedVehicle) {
        base.unshift({
          id: sharedVehicle.id,
          position: sharedVehicle.liveLocation,
          status: sharedVehicle.destinationPosition ? 'enroute' : 'idle',
        })
      }

      return base
    },
    [sharedVehicle],
  )

  const congestion = useMemo<MapCongestion[]>(
    () => [
      { id: 'c1', position: { lat: 28.4578, lng: 77.0304 }, level: 'high' },
      { id: 'c2', position: { lat: 28.4661, lng: 77.0329 }, level: 'medium' },
      { id: 'c3', position: { lat: 28.4524, lng: 77.0271 }, level: 'low' },
    ],
    [],
  )

  const cameras = useMemo<MapCamera[]>(
    () => [
      { id: 'cam-08', position: { lat: 28.4615, lng: 77.0244 }, label: 'Cam 08 • MG Rd' },
      { id: 'cam-11', position: { lat: 28.4562, lng: 77.0222 }, label: 'Cam 11 • Link Rd' },
      { id: 'cam-03', position: { lat: 28.4684, lng: 77.0277 }, label: 'Cam 03 • Ring' },
    ],
    [],
  )

  const routePolyline = useMemo<LatLng[]>(
    () => {
      if (sharedVehicle?.destinationPosition) {
        return [sharedVehicle.liveLocation, sharedVehicle.destinationPosition]
      }

      return [
        { lat: 28.4629, lng: 77.0289 },
        { lat: 28.4605, lng: 77.0312 },
        { lat: 28.4579, lng: 77.0324 },
        { lat: 28.4539, lng: 77.0338 },
        { lat: 28.4498, lng: 77.0385 },
      ]
    },
    [sharedVehicle],
  )

  const liveActiveRoutes = useMemo<ActiveRoute[]>(() => {
    const baseRoutes = activeRoutes
    if (!sharedVehicle) return baseRoutes

    return [
      {
        id: `ER-${sharedVehicle.id}`,
        ambulanceId: sharedVehicle.id,
        from: sharedVehicle.liveAddress,
        to: sharedVehicle.destinationLabel ?? 'Destination pending',
        etaMin: sharedVehicle.etaMinutes ?? 0,
        corridor: 'GREEN',
      },
      ...baseRoutes,
    ]
  }, [activeRoutes, sharedVehicle])

  function pushNotification(title: string, message: string) {
    setNotifications((prev) => [{ id: crypto.randomUUID(), title, message }, ...prev].slice(0, 8))
  }

  useEffect(() => {
    const syncEvidence = () => setEvidence(getViolationEvidence())
    syncEvidence()
    window.addEventListener(VIOLATION_EVIDENCE_EVENT, syncEvidence)
    window.addEventListener('storage', syncEvidence)
    return () => {
      window.removeEventListener(VIOLATION_EVIDENCE_EVENT, syncEvidence)
      window.removeEventListener('storage', syncEvidence)
    }
  }, [])

  useEffect(() => {
    const syncVehicle = () => setSharedVehicle(getActiveEmergencyVehicle())
    syncVehicle()
    window.addEventListener(ACTIVE_EMERGENCY_EVENT, syncVehicle as EventListener)
    window.addEventListener('storage', syncVehicle)

    return () => {
      window.removeEventListener(ACTIVE_EMERGENCY_EVENT, syncVehicle as EventListener)
      window.removeEventListener('storage', syncVehicle)
    }
  }, [])

  function approve(reqId: string) {
    const req = requests.find((item) => item.id === reqId)
    if (!req) return

    setRequests((prev) => prev.filter((item) => item.id !== reqId))
    setActiveRoutes((prev) => [
      { id: `ER-${req.ambulanceId}`, ambulanceId: req.ambulanceId, from: req.location, to: req.destination, etaMin: 12, corridor: 'GREEN' },
      ...prev,
    ])
    pushNotification('Route approved', `${req.ambulanceId} corridor cleared with GREEN priority.`)
  }

  function modify(reqId: string) {
    const req = requests.find((item) => item.id === reqId)
    if (!req) return
    pushNotification('Manual review queued', `Operator is reviewing corridor plan for ${req.ambulanceId}.`)
  }

  function renderRequests() {
    return (
      <div className="rounded-[30px] border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-white">Incoming SOS Queue</div>
            <div className="mt-1 text-sm text-slate-400">Approve, modify, or reprioritize live emergency requests.</div>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">{requests.length} active</div>
        </div>
        <div className="space-y-4 p-5">
          {requests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-white">{request.ambulanceId}</div>
                    <div className={'rounded-full px-3 py-1 text-[11px] ring-1 ' + priorityCls(request.priority)}>
                      {request.priority.toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-300">
                    <div>Pickup: {request.location}</div>
                    <div>Destination: {request.destination}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => approve(request.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => modify(request.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
                  >
                    <Pencil className="h-4 w-4" />
                    Modify
                  </button>
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 ? <div className="rounded-3xl bg-white/5 px-4 py-8 text-center text-sm text-slate-400">No pending requests.</div> : null}
        </div>
      </div>
    )
  }

  function renderEvidence() {
    return (
      <div className="rounded-[30px] border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-white">Driver Evidence Desk</div>
            <div className="mt-1 text-sm text-slate-400">Review number-plate captures forwarded by drivers for legal action.</div>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">{evidence.length} items</div>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {evidence.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45">
              <img src={item.image} alt={`Evidence ${item.time}`} className="h-56 w-full object-cover" />
              <div className="space-y-2 px-4 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{item.source}</span>
                  <span className="text-slate-400">{item.time}</span>
                </div>
                <div className="text-slate-300">{item.note}</div>
                <button
                  type="button"
                  onClick={() => pushNotification('Evidence tagged', `Legal follow-up marked for image captured at ${item.time}.`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                >
                  <FileWarning className="h-4 w-4" />
                  Mark for legal action
                </button>
              </div>
            </div>
          ))}
          {evidence.length === 0 ? <div className="col-span-full rounded-3xl bg-white/5 px-4 py-8 text-center text-sm text-slate-400">Driver plate captures will appear here for legal review.</div> : null}
        </div>
      </div>
    )
  }

  function renderCorridors() {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <EmergencyRoutePanel title="Live Corridor Operations" routes={liveActiveRoutes} />
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold text-white">Traffic Signal Actions</div>
          <div className="mt-4 space-y-4">
            {[
              { title: 'MG Road Green Wave', note: 'Ready for A-12 corridor push.', accent: 'bg-emerald-400' },
              { title: 'Cyber Hub Priority Cut', note: 'Stage yellow hold for 90 seconds.', accent: 'bg-amber-300' },
              { title: 'Sector 29 Diversion', note: 'Manual barricade team notified.', accent: 'bg-cyan-300' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${item.accent}`} />
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-400">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderMonitoring() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Detection Accuracy', value: '96.4%' },
            { label: 'OCR Confidence', value: '93.1%' },
            { label: 'Priority Escalations', value: '04' },
            { label: 'Open Cases', value: String(monitoringCases.length) },
          ].map((card) => (
            <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</div>
              <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-white">AI Monitoring Desk</div>
                <div className="mt-1 text-sm text-slate-400">Traffic control now handles corridor detections and operator escalation in one workspace.</div>
              </div>
              <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100 ring-1 ring-cyan-400/25">Live AI</div>
            </div>
            <div className="relative h-[420px] overflow-hidden bg-black">
              <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_25%_20%,rgba(34,211,238,.18),transparent_35%),radial-gradient(700px_circle_at_75%_65%,rgba(251,146,60,.12),transparent_35%),linear-gradient(160deg,rgba(15,23,42,.35),rgba(2,6,23,.9))]" />
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="absolute left-[18%] top-[22%] h-[42%] w-[46%] rounded-[32px] border-2 border-rose-400/80 shadow-[0_0_0_1px_rgba(251,113,133,.2),0_0_30px_rgba(251,113,133,.25)]" />
              <div className="absolute left-5 top-5 rounded-full bg-black/55 px-4 py-2 text-xs text-white ring-1 ring-white/10 backdrop-blur">
                LIVE • Corridor AI tracking active
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-[28px] bg-black/50 px-5 py-4 text-sm text-white/75 ring-1 ring-white/10 backdrop-blur">
                <div className="font-semibold text-white">Emergency lane blocked by HR26AB1234</div>
                <div className="mt-2 text-white/60">AI linked the obstruction to an active ambulance corridor and queued the case for traffic enforcement.</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">AI Analytics</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Hotspot Trend</div>
                  <div className="mt-2 text-xl font-semibold text-white">MG Road and NH-48 remain highest risk.</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">AI Recommendation</div>
                  <div className="mt-2 text-sm text-slate-300">Pre-arm green-wave logic for Cam 08 and Cam 11 corridors during peak emergency demand.</div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="text-lg font-semibold text-white">Action Queue</div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl bg-white/5 px-4 py-3">Send enforcement warning to HR26AB1234.</div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Share corridor-clear request with nearest traffic node.</div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Attach AI clip and OCR snapshot to legal case bundle.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="text-lg font-semibold text-white">Detection Results</div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">{monitoringCases.length} recent cases</div>
          </div>
          <div className="grid gap-4 p-5 xl:grid-cols-3">
            {monitoringCases.map((violation) => (
              <ViolationCard key={violation.id} v={violation} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderAnalytics() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Predicted Corridor Stability', value: '91.6%' },
            { label: 'AI Alerts This Hour', value: '07' },
            { label: 'Operator Escalations', value: '03' },
            { label: 'Live Vehicle Sync', value: sharedVehicle ? 'Online' : 'Waiting' },
          ].map((card) => (
            <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</div>
              <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-semibold text-white">AI Analytics</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-white/45">Hotspot Trend</div>
                <div className="mt-2 text-sm text-slate-300">MG Road and NH-48 remain the strongest congestion and enforcement hotspots.</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-white/45">Signal Optimization</div>
                <div className="mt-2 text-sm text-slate-300">Green-wave prioritization should stay armed for active corridors around the current live vehicle path.</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-white/45">Enforcement Confidence</div>
                <div className="mt-2 text-2xl font-semibold text-white">93.1%</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-white/45">Response Prediction</div>
                <div className="mt-2 text-2xl font-semibold text-white">11 min</div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-semibold text-white">Operational Recommendations</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">Hold adaptive signal priority near current emergency vehicle destination corridors.</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">Increase monitoring sensitivity for lane-blocking events in the current live route sector.</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">Push field coordination updates if ETA rises above the predicted corridor window.</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active Corridors', value: String(activeRoutes.length), icon: TrafficCone },
            { label: 'Pending SOS', value: String(requests.length), icon: Siren },
            { label: 'Evidence Queue', value: String(evidence.length), icon: FileWarning },
            { label: 'Congestion Alerts', value: '03', icon: Waves },
          ].map((card) => (
            <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</div>
                <card.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">Live City Grid</div>
                <div className="mt-1 text-sm text-slate-400">Operator map with congestion, cameras, ambulances, and current emergency corridor.</div>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">Live Sync</div>
            </div>
            <div className="mt-5">
              <SmartMapView
                center={sharedVehicle?.liveLocation ?? center}
                zoom={13}
                className="h-[560px] min-h-[380px] w-full"
                ambulances={ambulances}
                destination={
                  sharedVehicle?.destinationPosition
                    ? { label: sharedVehicle.destinationLabel ?? 'Emergency destination', position: sharedVehicle.destinationPosition }
                    : { label: 'Medanta Hospital', position: { lat: 28.4376, lng: 77.04 } }
                }
                route={routePolyline}
                congestion={congestion}
                cameras={cameras}
              />
            </div>
          </div>

          <div className="space-y-6">
            {sharedVehicle ? (
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-semibold text-white">Live Emergency Vehicle</div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-white/45">Vehicle</div>
                    <div className="mt-2 text-lg font-semibold text-white">{sharedVehicle.vehicleType} • {sharedVehicle.id}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-white/45">Live Location</div>
                    <div className="mt-2 text-sm text-slate-300">{sharedVehicle.liveAddress}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-white/45">Destination</div>
                    <div className="mt-2 text-sm text-slate-300">{sharedVehicle.destinationLabel ?? 'Destination pending'}</div>
                  </div>
                </div>
              </div>
            ) : null}
            {renderRequests()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(1000px_circle_at_0%_0%,rgba(34,211,238,.14),transparent_35%),radial-gradient(900px_circle_at_95%_10%,rgba(251,146,60,.12),transparent_30%),linear-gradient(180deg,#050b16_0%,#0a1222_55%,#101a2f_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-[108px] shrink-0 border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur lg:block">
          <div className="grid place-items-center rounded-3xl bg-cyan-400 px-4 py-5 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-950">
            TCR
          </div>
          <div className="mt-8 space-y-3">
            {commandTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`flex w-full flex-col items-center gap-2 rounded-3xl px-3 py-4 text-center text-xs font-medium transition ${
                  activeView === tab.key ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => nav('/login')}
            className="mt-8 flex w-full flex-col items-center gap-2 rounded-3xl bg-rose-500 px-3 py-4 text-center text-xs font-medium text-white transition hover:bg-rose-400"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 xl:px-8">
          <div className="sticky top-0 z-20 mb-6 rounded-[28px] border border-white/10 bg-slate-950/55 px-5 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Traffic Control Room</div>
                <div className="mt-2 text-3xl font-semibold">Urban Command Console</div>
                <div className="mt-1 text-sm text-slate-400">Monitor emergency corridors, approve requests, and process driver evidence.</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 md:inline-flex">
                  <Activity className="mr-2 h-4 w-4 text-emerald-300" />
                  System Live
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3 lg:hidden">
            {commandTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activeView === tab.key ? 'bg-cyan-400 text-slate-950' : 'bg-white/6 text-white/80 ring-1 ring-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeView === 'overview' ? renderOverview() : null}
          {activeView === 'requests' ? renderRequests() : null}
          {activeView === 'corridors' ? renderCorridors() : null}
          {activeView === 'monitoring' ? renderMonitoring() : null}
          {activeView === 'analytics' ? renderAnalytics() : null}
          {activeView === 'evidence' ? renderEvidence() : null}
        </main>
      </div>

      {notificationsOpen ? (
        <div className="fixed right-4 top-24 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/92">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-white">Control Alerts</div>
                <div className="mt-1 text-sm text-slate-400">Live command-room updates.</div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10"
              >
                Close
              </button>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-auto p-4">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
