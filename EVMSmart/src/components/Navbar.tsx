import { Bell, Radio, UserCircle2 } from 'lucide-react'

export default function Navbar(props: { heading: string; subheading?: string; roleLabel?: string }) {
  const { heading, subheading, roleLabel } = props

  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-900/60 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-white">{heading}</div>
          {subheading ? <div className="mt-0.5 text-xs text-white/55">{subheading}</div> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl bg-gray-800/50 px-3 py-2 text-xs text-white/65 ring-1 ring-white/10 md:flex">
            <Radio className="h-4 w-4 text-emerald-300" />
            <span>Live</span>
            <span className="text-white/35">•</span>
            <span className="tabular-nums">{time}</span>
          </div>

          {roleLabel ? (
            <div className="hidden items-center gap-2 rounded-xl bg-gray-800/40 px-3 py-2 text-xs text-white/65 ring-1 ring-white/10 md:flex">
              <UserCircle2 className="h-4 w-4 text-blue-300" />
              <span>{roleLabel}</span>
            </div>
          ) : null}

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-gray-800/40 text-white/70 ring-1 ring-white/10 transition hover:bg-gray-800 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,.8)]" />
          </button>
        </div>
      </div>
    </header>
  )
}

