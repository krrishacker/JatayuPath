import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export default function Sidebar(props: { title?: string; items: NavItem[] }) {
  const { title = 'Emergency Route AI', items } = props

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-gray-900/70 backdrop-blur">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/20 ring-1 ring-blue-500/30">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,.65)]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/55">Smart-city control suite</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                'text-white/70 hover:bg-gray-800 hover:text-white',
                isActive && 'bg-blue-600/15 text-white ring-1 ring-blue-500/25',
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 opacity-90" />
            <span>{item.label}</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 opacity-0 shadow-[0_0_14px_rgba(96,165,250,.8)] transition group-hover:opacity-100" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
