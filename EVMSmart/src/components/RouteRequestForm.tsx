import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Navigation, Siren } from 'lucide-react'

export type EmergencyType = 'Cardiac' | 'Accident' | 'Fire' | 'Critical Transfer'

export type RouteRequest = {
  start: string
  destination: string
  emergencyType: EmergencyType
  notes?: string
}

export default function RouteRequestForm(props: {
  onRequest?: (req: RouteRequest) => Promise<void> | void
  initialDestination?: string
  nearestHospitalLabel?: string
  liveCoords?: string | null
}) {
  const { onRequest, initialDestination, nearestHospitalLabel, liveCoords } = props
  const [start, setStart] = useState('Near Sector 18, Gurugram')
  const [destination, setDestination] = useState(initialDestination ?? 'Medanta Hospital')
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('Cardiac')
  const [notes, setNotes] = useState('Ambulance stuck in congestion, need emergency lane clearance.')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination)
    }
  }, [initialDestination])

  const canSubmit = useMemo(
    () => (liveCoords ?? start).trim() && destination.trim() && !isLoading,
    [liveCoords, start, destination, isLoading],
  )

  async function submit() {
    if (!canSubmit) return
    setIsLoading(true)
    try {
      await onRequest?.({ start: liveCoords ?? start, destination, emergencyType, notes })
      await new Promise((r) => setTimeout(r, 650))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-red-300" />
          <div className="text-sm font-semibold text-white">Emergency SOS</div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,.65)]" />
          Dispatch-ready
        </div>
      </div>

      <div className="space-y-3 p-4">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-white/60">Current location</div>
          <input
            value={liveCoords ?? start}
            onChange={(e) => !liveCoords && setStart(e.target.value)}
            readOnly={!!liveCoords}
            className="w-full rounded-xl bg-gray-800/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-blue-500/35"
            placeholder="Click Get my location on map, or enter manually"
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-white/60">
            <span>Destination (hospital / control point)</span>
            {nearestHospitalLabel ? (
              <button
                type="button"
                onClick={() => setDestination(nearestHospitalLabel)}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-800/80 px-2 py-1 text-[11px] font-normal text-blue-200 ring-1 ring-blue-500/30 hover:bg-gray-800"
              >
                <Navigation className="h-3.5 w-3.5" />
                Use nearest: {nearestHospitalLabel}
              </button>
            ) : null}
          </div>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 w-full rounded-xl bg-gray-800/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-blue-500/35"
            placeholder="Enter hospital / destination"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-white/60">SOS type</div>
          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value as EmergencyType)}
            className="w-full rounded-xl bg-gray-800/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-blue-500/35"
          >
            <option>Cardiac</option>
            <option>Accident</option>
            <option>Fire</option>
            <option>Critical Transfer</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-white/60">Short note for control room</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl bg-gray-800/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-blue-500/35"
            placeholder="Tell operators what is blocking you (lane blocked, signal stuck on red, accident ahead, etc.)"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 ring-1 ring-red-400/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
          {isLoading ? 'Sending SOS…' : 'Send SOS to control room'}
        </button>

        <div className="rounded-xl bg-gray-800/40 px-3 py-2 text-xs text-white/55 ring-1 ring-white/10">
          SOS will notify the traffic control room, auto-compute the fastest corridor, and highlight your route. Lane
          blockers detected by the ambulance camera will be flagged for e-challan.
        </div>
      </div>
    </div>
  )
}

