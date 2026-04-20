import { useMemo } from 'react'
import { AlertTriangle, ArrowRight, Camera, ShieldAlert, Siren, Sparkles, Video } from 'lucide-react'
import DashboardShell from '../components/DashboardShell'
import ViolationCard, { type Violation } from '../components/ViolationCard'

export default function ViolationMonitoringPage() {
  const navItems = useMemo(
    () => [
      { to: '/violations', label: 'AI Monitoring', icon: ShieldAlert },
      { to: '/traffic', label: 'Traffic Control', icon: Siren },
      { to: '/admin', label: 'Analytics', icon: Sparkles },
    ],
    [],
  )

  const violations = useMemo<Violation[]>(
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

  return (
    <DashboardShell
      navItems={navItems}
      navbar={{ heading: 'AI Violation Monitoring', subheading: 'Real-time camera intelligence for emergency lane enforcement', roleLabel: 'AI Operator' }}
    >
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-gray-900 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-200" />
                <div>
                  <div className="text-base font-semibold text-white">Live Camera Intelligence</div>
                  <div className="mt-1 text-sm text-white/55">Cam 08 • MG Road • 1080p feed • active detector stack</div>
                </div>
              </div>
              <div className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-200 ring-1 ring-rose-500/25">Incident Live</div>
            </div>

            <div className="relative h-[560px] overflow-hidden bg-black">
              <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_25%_20%,rgba(34,211,238,.18),transparent_35%),radial-gradient(700px_circle_at_75%_65%,rgba(251,146,60,.12),transparent_35%),linear-gradient(160deg,rgba(15,23,42,.35),rgba(2,6,23,.85))]" />
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:36px_36px]" />

              <div className="absolute left-5 top-5 flex flex-wrap gap-3">
                <div className="rounded-full bg-black/55 px-4 py-2 text-xs text-white ring-1 ring-white/10 backdrop-blur">
                  LIVE • AI tracking active
                </div>
                <div className="rounded-full bg-cyan-400/15 px-4 py-2 text-xs text-cyan-100 ring-1 ring-cyan-400/25 backdrop-blur">
                  OCR + corridor detection
                </div>
              </div>

              <div className="absolute left-[18%] top-[22%] h-[42%] w-[46%] rounded-[32px] border-2 border-rose-400/80 shadow-[0_0_0_1px_rgba(251,113,133,.2),0_0_30px_rgba(251,113,133,.25)]">
                <div className="absolute -top-10 left-0 rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-100 ring-1 ring-rose-500/25 backdrop-blur">
                  Violation area detected
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="rounded-[28px] bg-black/50 px-5 py-4 text-sm text-white/75 ring-1 ring-white/10 backdrop-blur">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-300" />
                    Emergency lane blocked by HR26AB1234
                  </div>
                  <div className="mt-2 text-white/60">
                    Vehicle is obstructing a live priority corridor while an ambulance is 1.2 km away from the segment.
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <ArrowRight className="h-4 w-4" />
                  Push to control room
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-gray-900 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <div className="text-base font-semibold text-white">AI Summary</div>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Detection Accuracy</div>
                  <div className="mt-2 text-2xl font-semibold text-white">96.4%</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Plate OCR Confidence</div>
                  <div className="mt-2 text-2xl font-semibold text-white">93.1%</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Priority Escalations</div>
                  <div className="mt-2 text-2xl font-semibold text-white">04</div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-gray-900 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-200" />
                <div className="text-base font-semibold text-white">Action Queue</div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl bg-white/5 px-4 py-3">Send enforcement warning to HR26AB1234.</div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Share corridor-clear request with nearest traffic node.</div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">Attach AI clip and OCR snapshot to legal case bundle.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-gray-900 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-200" />
              <div className="text-base font-semibold text-white">Detection Results</div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">{violations.length} recent cases</div>
          </div>
          <div className="grid gap-4 p-5 xl:grid-cols-3">
            {violations.map((violation) => (
              <ViolationCard key={violation.id} v={violation} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
