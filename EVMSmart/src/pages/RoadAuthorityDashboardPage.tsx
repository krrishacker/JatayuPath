import { useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardCheck, LogOut, MapPin, TrafficCone, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPotholeEvidence, POTHOLE_EVIDENCE_EVENT, type PotholeEvidence } from '../lib/potholeEvidence'

type Notification = { id: string; title: string; message: string }

export default function RoadAuthorityDashboardPage() {
  const nav = useNavigate()
  const [evidence, setEvidence] = useState<PotholeEvidence[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const metrics = useMemo(
    () => [
      { label: 'Pothole Captures', value: String(evidence.length), icon: TrafficCone },
      { label: 'Pending Work Orders', value: '06', icon: ClipboardCheck },
      { label: 'Active Crews', value: '03', icon: Wrench },
    ],
    [evidence.length],
  )

  useEffect(() => {
    const syncEvidence = () => setEvidence(getPotholeEvidence())
    syncEvidence()
    window.addEventListener(POTHOLE_EVIDENCE_EVENT, syncEvidence)
    window.addEventListener('storage', syncEvidence)
    return () => {
      window.removeEventListener(POTHOLE_EVIDENCE_EVENT, syncEvidence)
      window.removeEventListener('storage', syncEvidence)
    }
  }, [])

  function pushNotification(title: string, message: string) {
    setNotifications((prev) => [{ id: crypto.randomUUID(), title, message }, ...prev].slice(0, 8))
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(900px_circle_at_10%_0%,rgba(251,146,60,.14),transparent_40%),radial-gradient(900px_circle_at_95%_15%,rgba(34,211,238,.12),transparent_35%),linear-gradient(180deg,#060b14_0%,#0b1324_55%,#111b30_100%)] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-slate-950/60 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-amber-300">Road Authority Console</div>
              <div className="mt-2 text-3xl font-semibold">Pothole Intake Desk</div>
              <div className="mt-1 text-sm text-slate-400">Review pothole captures sent by drivers and dispatch repair crews.</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" /> : null}
              </button>
              <button
                type="button"
                onClick={() => nav('/login')}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((card) => (
            <div key={card.label} className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</div>
                <card.icon className="h-5 w-5 text-amber-300" />
              </div>
              <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[30px] border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-lg font-semibold text-white">Driver Pothole Captures</div>
              <div className="mt-1 text-sm text-slate-400">Use these images to prioritize urgent road maintenance.</div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">{evidence.length} items</div>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {evidence.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45">
                <img src={item.image} alt={`Pothole capture ${item.time}`} className="h-56 w-full object-cover" />
                <div className="space-y-3 px-4 py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{item.source}</span>
                    <span className="text-slate-400">{item.time}</span>
                  </div>
                  <div className="text-slate-300">{item.note}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => pushNotification('Work order created', `Maintenance ticket issued for capture at ${item.time}.`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Create work order
                    </button>
                    <button
                      type="button"
                      onClick={() => pushNotification('Crew dispatched', 'Nearest crew has been notified for inspection.')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
                    >
                      <MapPin className="h-4 w-4" />
                      Dispatch crew
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {evidence.length === 0 ? (
              <div className="col-span-full rounded-3xl bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
                No pothole captures yet. Driver snapshots will appear here for review.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {notificationsOpen ? (
        <div className="fixed right-4 top-24 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/92">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-white">Authority Alerts</div>
                <div className="mt-1 text-sm text-slate-400">Recent road maintenance actions.</div>
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
              {notifications.length === 0 ? (
                <div className="rounded-3xl bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
                  No alerts yet.
                </div>
              ) : null}
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
