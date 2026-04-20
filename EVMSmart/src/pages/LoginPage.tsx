import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Lock, Mail, MapPinned, ShieldCheck, Siren, UserPlus } from 'lucide-react'
import { setSessionRole, type SessionRole } from '../lib/sessionRole'

type AuthMode = 'signin' | 'signup'
type Role = SessionRole

export default function LoginPage() {
  const nav = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [role, setRole] = useState<Role>('Ambulance Driver')
  const [name, setName] = useState('Aarav Singh')
  const [email, setEmail] = useState('operator@emergencyroute.ai')
  const [password, setPassword] = useState('password')

  const target = useMemo(() => {
    if (role === 'Ambulance Driver') return '/driver'
    if (role === 'Traffic Control Officer') return '/traffic'
    if (role === 'Hospital Coordinator') return '/hospital'
    return '/road-authority'
  }, [role])

  const canSubmit =
    email.trim().length > 3 &&
    password.trim().length > 1 &&
    (mode === 'signin' || name.trim().length > 1)

  return (
    <div className="min-h-full overflow-auto bg-[radial-gradient(1200px_circle_at_15%_5%,rgba(14,165,233,.28),transparent_45%),radial-gradient(1000px_circle_at_85%_0%,rgba(251,146,60,.18),transparent_40%),linear-gradient(180deg,#08111f_0%,#0b1220_45%,#0f172a_100%)] px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_15%_15%,rgba(56,189,248,.18),transparent_40%),radial-gradient(700px_circle_at_85%_25%,rgba(251,191,36,.14),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_55%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100">
              <Siren className="h-4 w-4" />
              Emergency Route AI
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Priority corridor control built for drivers in motion.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
              Sign in or create an account to launch a mobile-first driver cockpit with live GPS, route guidance, SOS dispatch,
              and instant plate evidence capture from your physical camera.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Live Map</div>
                <div className="mt-2 text-2xl font-semibold text-white">GPS</div>
                <div className="mt-2 text-sm text-slate-400">Locate the vehicle, compute route modes, and pin the destination.</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Evidence</div>
                <div className="mt-2 text-2xl font-semibold text-white">Plate Capture</div>
                <div className="mt-2 text-sm text-slate-400">Capture violation images and forward them to traffic control instantly.</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Dispatch</div>
                <div className="mt-2 text-2xl font-semibold text-white">SOS</div>
                <div className="mt-2 text-sm text-slate-400">Send emergency requests with route context from a single screen.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex rounded-2xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === 'signin' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === 'signup' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-6">
            <div className="text-2xl font-semibold text-white">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>
            <div className="mt-2 text-sm text-slate-400">
              {mode === 'signin'
                ? 'Use your role-based account to open the right dashboard.'
                : 'Set up a role and launch the workspace immediately.'}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {mode === 'signup' ? (
              <label className="block">
                <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Full Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
                  placeholder="Enter full name"
                />
              </label>
            ) : null}

            <label className="block">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Role</div>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
                >
                  <option className="text-slate-900">Ambulance Driver</option>
                  <option className="text-slate-900">Traffic Control Officer</option>
                  <option className="text-slate-900">Hospital Coordinator</option>
                  <option className="text-slate-900">Road Authority</option>
                </select>
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Email</div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
                  placeholder="you@domain.com"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Password</div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/8"
                  placeholder="********"
                />
              </div>
            </label>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              setSessionRole(role)
              nav(target)
            }}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'signin' ? <ArrowRight className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-medium text-white">
              <Building2 className="h-4 w-4 text-cyan-300" />
              Role-based access
            </div>
            <div className="mt-2 text-slate-400">
              Driver accounts open the mobile control cockpit. Traffic control accounts open the command console with integrated AI monitoring.
              Hospital coordinators open the patient cabin feed to guide paramedics in real time.
              Road authority accounts review pothole captures for maintenance dispatch.
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav('/route-planner')}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            <MapPinned className="h-4 w-4" />
            Open Google Route Planner
          </button>
        </section>
      </div>
    </div>
  )
}
