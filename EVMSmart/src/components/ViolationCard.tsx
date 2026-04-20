import { BadgeAlert, Camera, CheckCircle2 } from 'lucide-react'

export type Violation = {
  id: string
  vehicleNumber: string
  violation: string
  time: string
  status: 'violation' | 'clear' | 'review'
  cameraLabel: string
}

export default function ViolationCard(props: { v: Violation }) {
  const { v } = props
  const badge =
    v.status === 'violation'
      ? { label: 'Violation', cls: 'bg-rose-500/12 text-rose-200 ring-rose-500/25', Icon: BadgeAlert }
      : v.status === 'review'
        ? { label: 'Review', cls: 'bg-amber-500/12 text-amber-200 ring-amber-500/25', Icon: BadgeAlert }
        : { label: 'Clear', cls: 'bg-emerald-500/12 text-emerald-200 ring-emerald-500/25', Icon: CheckCircle2 }

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/55 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4.5 w-4.5 text-amber-200" />
          <div className="text-sm font-semibold text-white">{v.cameraLabel}</div>
        </div>
        <div className={'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ring-1 ' + badge.cls}>
          <badge.Icon className="h-3.5 w-3.5" />
          {badge.label}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 text-sm">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
          <div className="text-xs text-white/55">Vehicle Number</div>
          <div className="font-semibold text-white">{v.vehicleNumber}</div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
          <div className="text-xs text-white/55">Violation</div>
          <div className="font-medium text-white/85">{v.violation}</div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
          <div className="text-xs text-white/55">Time</div>
          <div className="font-medium text-white/85 tabular-nums">{v.time}</div>
        </div>
      </div>
    </div>
  )
}
