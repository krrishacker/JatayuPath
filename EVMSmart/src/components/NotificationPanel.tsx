import { Bell, CircleCheck, TriangleAlert } from 'lucide-react'

export type Notification = {
  id: string
  title: string
  message: string
  level: 'info' | 'warning' | 'critical'
  time: string
}

export default function NotificationPanel(props: { items: Notification[]; title?: string }) {
  const { items, title = 'Live Notifications' } = props

  return (
    <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-blue-300" />
          <div className="text-sm font-semibold text-white">{title}</div>
        </div>
        <div className="text-xs text-white/55">{items.length}</div>
      </div>

      <div className="max-h-[300px] divide-y divide-white/10 overflow-auto">
        {items.map((n) => {
          const meta =
            n.level === 'critical'
              ? { cls: 'text-red-200', Icon: TriangleAlert }
              : n.level === 'warning'
                ? { cls: 'text-yellow-200', Icon: TriangleAlert }
                : { cls: 'text-emerald-200', Icon: CircleCheck }

          return (
            <div key={n.id} className="notif-pop px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-gray-800/60 ring-1 ring-white/10">
                  <meta.Icon className={'h-4 w-4 ' + meta.cls} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-xs font-semibold text-white">{n.title}</div>
                    <div className="shrink-0 text-[11px] text-white/45 tabular-nums">{n.time}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">{n.message}</div>
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 ? <div className="px-4 py-6 text-center text-sm text-white/55">No alerts.</div> : null}
      </div>
    </div>

  )
}

