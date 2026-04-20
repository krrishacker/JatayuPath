import type { ReactNode } from 'react'
import Sidebar, { type NavItem } from './Sidebar'
import Navbar from './Navbar'

export default function DashboardShell(props: {
  navItems: NavItem[]
  navbar: { heading: string; subheading?: string; roleLabel?: string }
  rightPanel?: ReactNode
  children: ReactNode
}) {
  const { navItems, navbar, rightPanel, children } = props

  return (
    <div className="h-full bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(59,130,246,.18),transparent_55%),radial-gradient(1000px_circle_at_70%_0%,rgba(16,185,129,.10),transparent_55%),radial-gradient(900px_circle_at_95%_60%,rgba(234,179,8,.10),transparent_45%)]">
      <div className="flex h-full">
        <Sidebar items={navItems} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar {...navbar} />
          <main className="min-h-0 flex-1 overflow-auto p-5">
            <div className="grid min-h-0 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="min-h-0 overflow-hidden">{children}</div>
              {rightPanel ? <aside className="min-h-0 overflow-auto">{rightPanel}</aside> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

