import { useMemo } from 'react'
import { BarChart3, LayoutDashboard, MapPinned, ShieldAlert, Siren } from 'lucide-react'
import DashboardShell from '../components/DashboardShell'
import AnalyticsChart from '../components/AnalyticsChart'

function KpiCard(props: { label: string; value: string; accent: 'blue' | 'emerald' | 'yellow' | 'red' }) {
  const { label, value, accent } = props
  const accentCls =
    accent === 'blue'
      ? 'from-blue-500/18 to-transparent ring-blue-500/20 text-blue-200'
      : accent === 'emerald'
        ? 'from-emerald-500/14 to-transparent ring-emerald-500/20 text-emerald-200'
        : accent === 'yellow'
          ? 'from-yellow-500/14 to-transparent ring-yellow-500/20 text-yellow-200'
          : 'from-red-500/14 to-transparent ring-red-500/20 text-red-200'

  return (
    <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
      <div className={'rounded-2xl bg-gradient-to-br ' + accentCls}>
        <div className="p-4">
          <div className="text-xs font-medium text-white/60">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white tabular-nums">{value}</div>
          <div className="mt-2 h-1 w-20 rounded-full bg-white/10">
            <div className="h-1 w-12 rounded-full bg-white/35" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const navItems = useMemo(
    () => [
      { to: '/admin', label: 'Admin Analytics', icon: BarChart3 },
      { to: '/route-planner', label: 'Route Planner', icon: MapPinned },
      { to: '/traffic', label: 'Traffic Control', icon: MapPinned },
      { to: '/violations', label: 'AI Monitoring', icon: ShieldAlert },
      { to: '/driver', label: 'Driver View', icon: LayoutDashboard },
      { to: '/login', label: 'Logout', icon: Siren },
    ],
    [],
  )

  const responseTimeData = useMemo(
    () => ({
      labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
      datasets: [
        {
          label: 'Response time (min)',
          data: [13.2, 12.1, 11.6, 10.9, 12.8, 11.3, 10.7],
          borderColor: 'rgba(96,165,250,1)',
          backgroundColor: 'rgba(96,165,250,.18)',
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    }),
    [],
  )

  const violationsByLocation = useMemo(
    () => ({
      labels: ['MG Rd', 'NH-48', 'Cyber Hub', 'Sector 29', 'Golf Course'],
      datasets: [
        {
          label: 'Violations',
          data: [11, 18, 9, 7, 14],
          backgroundColor: 'rgba(250,204,21,.35)',
          borderColor: 'rgba(250,204,21,.9)',
          borderWidth: 1,
        },
      ],
    }),
    [],
  )

  const heat = useMemo(() => {
    const cells = Array.from({ length: 9 * 18 }, (_, i) => {
      // deterministic pseudo heat
      const v = (Math.sin(i * 0.42) + 1) / 2
      const boost = i % 17 === 0 ? 1 : 0
      const lvl = Math.min(1, v * 0.9 + boost * 0.55)
      return lvl
    })
    return cells
  }, [])

  return (
    <DashboardShell
      navItems={navItems}
      navbar={{ heading: 'Admin Analytics Dashboard', subheading: 'Performance, response times, and compliance trends', roleLabel: 'Admin' }}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total emergency routes today" value="34" accent="blue" />
          <KpiCard label="Average response time" value="11.4 min" accent="emerald" />
          <KpiCard label="Violations detected" value="59" accent="yellow" />
          <KpiCard label="Active routes" value="4" accent="red" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <AnalyticsChart title="Response time trend" type="line" data={responseTimeData} />
          <AnalyticsChart title="Violations by location" type="bar" data={violationsByLocation} />
        </div>

        <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-white">Traffic congestion heatmap</div>
            <div className="text-xs text-white/55">Synthetic demo overlay</div>
          </div>
          <div className="p-4">
            <div className="rounded-2xl bg-gray-950/40 p-4 ring-1 ring-white/10">
              <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
                {heat.map((lvl, idx) => {
                  const c =
                    lvl > 0.78
                      ? 'bg-red-500/60'
                      : lvl > 0.55
                        ? 'bg-yellow-500/55'
                        : lvl > 0.33
                          ? 'bg-emerald-500/35'
                          : 'bg-blue-500/15'
                  return <div key={idx} className={'h-3 w-3 rounded-[4px] ring-1 ring-white/5 ' + c} />
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-800/50 px-3 py-2 ring-1 ring-white/10">
                  <span className="h-2.5 w-2.5 rounded bg-blue-500/25 ring-1 ring-white/5" />
                  Low
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-800/50 px-3 py-2 ring-1 ring-white/10">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500/45 ring-1 ring-white/5" />
                  Moderate
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-800/50 px-3 py-2 ring-1 ring-white/10">
                  <span className="h-2.5 w-2.5 rounded bg-yellow-500/60 ring-1 ring-white/5" />
                  High
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-800/50 px-3 py-2 ring-1 ring-white/10">
                  <span className="h-2.5 w-2.5 rounded bg-red-500/70 ring-1 ring-white/5" />
                  Severe
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
