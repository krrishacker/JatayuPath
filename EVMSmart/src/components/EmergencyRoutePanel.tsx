import { ArrowRight, Route, ShieldCheck } from 'lucide-react'

export type ActiveRoute = {
  id: string
  ambulanceId: string
  from: string
  to: string
  etaMin: number
  corridor: 'GREEN' | 'YELLOW' | 'RED'
}

export default function EmergencyRoutePanel(props: { title?: string; routes: ActiveRoute[] }) {
  const { title = 'Active Emergency Routes', routes } = props

  return (
    <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-4.5 w-4.5 text-blue-300" />
          <div className="text-sm font-semibold text-white">{title}</div>
        </div>
        <div className="text-xs text-white/55">{routes.length} live</div>
      </div>

      <div className="max-h-[380px] divide-y divide-white/10 overflow-auto">
        {routes.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">Ambulance {r.ambulanceId}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
                  <span className="truncate">{r.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/35" />
                  <span className="truncate">{r.to}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-white tabular-nums">{r.etaMin} min</div>
                <div
                  className={
                    'mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ' +
                    (r.corridor === 'GREEN'
                      ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/25'
                      : r.corridor === 'YELLOW'
                        ? 'bg-yellow-500/10 text-yellow-200 ring-yellow-500/25'
                        : 'bg-red-500/10 text-red-200 ring-red-500/25')
                  }
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {r.corridor} corridor
                </div>
              </div>
            </div>
          </div>
        ))}

        {routes.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-white/55">No active routes right now.</div>
        ) : null}
      </div>
    </div>
  )
}

