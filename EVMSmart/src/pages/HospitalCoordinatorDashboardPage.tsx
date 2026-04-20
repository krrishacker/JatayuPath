import { useMemo, useState } from 'react'
import { Activity, BadgeCheck, Bell, HeartPulse, LogOut, Send, Stethoscope, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WifiCameraFeed from '../components/WifiCameraFeed'
import { getPatientCabinCameraConfig } from '../lib/cameraConfig'

type PatientVitals = {
  heartRate: number
  bloodPressure: string
  spo2: number
  respiration: number
  temperature: number
}

type AmbulanceCase = {
  id: string
  ambulanceId: string
  patientName: string
  age: number
  severity: 'critical' | 'high' | 'stable'
  etaMinutes: number
  location: string
  destination: string
  cameraLabel: string
  vitals: PatientVitals
  lastUpdate: string
  crew: string[]
}

type InstructionLog = {
  id: string
  message: string
  time: string
}

function severityBadge(severity: AmbulanceCase['severity']) {
  if (severity === 'critical') return 'bg-rose-500/15 text-rose-200 ring-rose-500/30'
  if (severity === 'high') return 'bg-amber-500/15 text-amber-200 ring-amber-500/30'
  return 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30'
}

export default function HospitalCoordinatorDashboardPage() {
  const nav = useNavigate()
  const [cases] = useState<AmbulanceCase[]>([
    {
      id: 'case-12',
      ambulanceId: 'A-12',
      patientName: 'Riya Sharma',
      age: 34,
      severity: 'critical',
      etaMinutes: 11,
      location: 'IFFCO Chowk',
      destination: 'Medanta Hospital',
      cameraLabel: 'Camera 2 - Patient Cabin',
      vitals: { heartRate: 122, bloodPressure: '90/60', spo2: 91, respiration: 28, temperature: 38.4 },
      lastUpdate: '30 sec ago',
      crew: ['Paramedic A. Kapoor', 'EMT J. Singh'],
    },
    {
      id: 'case-07',
      ambulanceId: 'A-07',
      patientName: 'Karan Verma',
      age: 58,
      severity: 'high',
      etaMinutes: 14,
      location: 'Cyber Hub',
      destination: 'Artemis Hospital',
      cameraLabel: 'Camera 2 - Patient Cabin',
      vitals: { heartRate: 104, bloodPressure: '100/70', spo2: 94, respiration: 24, temperature: 37.9 },
      lastUpdate: '1 min ago',
      crew: ['Paramedic P. Gill', 'EMT S. Rao'],
    },
    {
      id: 'case-19',
      ambulanceId: 'A-19',
      patientName: 'Neha Gupta',
      age: 41,
      severity: 'stable',
      etaMinutes: 18,
      location: 'Golf Course Rd',
      destination: 'Fortis Memorial',
      cameraLabel: 'Camera 2 - Patient Cabin',
      vitals: { heartRate: 96, bloodPressure: '118/76', spo2: 97, respiration: 20, temperature: 37.2 },
      lastUpdate: '2 min ago',
      crew: ['Paramedic L. Das', 'EMT R. Das'],
    },
  ])
  const [activeCaseId, setActiveCaseId] = useState(cases[0]?.id ?? '')
  const [instruction, setInstruction] = useState('Start oxygen at 6 L per min and monitor airway.')
  const [instructions, setInstructions] = useState<InstructionLog[]>([
    { id: 'ins-1', message: 'Assess GCS and report pupil response.', time: '2 min ago' },
    { id: 'ins-2', message: 'Prepare IV access with normal saline.', time: '1 min ago' },
  ])

  const activeCase = useMemo(
    () => cases.find((item) => item.id === activeCaseId) ?? cases[0],
    [cases, activeCaseId],
  )
  const patientCabinCamera = useMemo(() => getPatientCabinCameraConfig(), [])

  function sendInstruction() {
    const trimmed = instruction.trim()
    if (!trimmed) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setInstructions((prev) => [{ id: crypto.randomUUID(), message: trimmed, time: now }, ...prev].slice(0, 8))
    setInstruction('')
  }

  if (!activeCase) return null

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(900px_circle_at_15%_10%,rgba(45,212,191,.16),transparent_38%),radial-gradient(800px_circle_at_85%_0%,rgba(56,189,248,.14),transparent_38%),linear-gradient(180deg,#050b16_0%,#0a1222_55%,#101a2f_100%)] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-slate-950/60 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-300">Hospital Coordination Desk</div>
              <div className="mt-2 text-3xl font-semibold">Live Patient Cabin Feed</div>
              <div className="mt-1 text-sm text-slate-400">
                View the ambulance camera 2 feed and guide paramedics until the patient reaches the hospital.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10">
                <Activity className="h-4 w-4 text-emerald-300" />
                System Live
              </div>
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white"
              >
                <Bell className="h-5 w-5" />
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

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Active Ambulances</div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">{cases.length} live</div>
              </div>
              <div className="mt-4 space-y-3">
                {cases.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCaseId(item.id)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      activeCaseId === item.id
                        ? 'border-emerald-400/40 bg-emerald-400/10'
                        : 'border-white/10 bg-slate-950/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{item.ambulanceId}</div>
                      <div className={'rounded-full px-3 py-1 text-[11px] ring-1 ' + severityBadge(item.severity)}>
                        {item.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{item.patientName}, {item.age} yrs</div>
                    <div className="mt-2 text-xs text-slate-400">ETA {item.etaMinutes} min to {item.destination}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <HeartPulse className="h-5 w-5 text-rose-300" />
                Patient Vitals
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Heart Rate</div>
                  <div className="mt-2 text-2xl font-semibold">{activeCase.vitals.heartRate} bpm</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Blood Pressure</div>
                  <div className="mt-2 text-2xl font-semibold">{activeCase.vitals.bloodPressure}</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">SpO2</div>
                  <div className="mt-2 text-2xl font-semibold">{activeCase.vitals.spo2}%</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Respiration</div>
                  <div className="mt-2 text-2xl font-semibold">{activeCase.vitals.respiration} rpm</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Temperature</div>
                  <div className="mt-2 text-2xl font-semibold">{activeCase.vitals.temperature} C</div>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Last Update</div>
                  <div className="mt-2 text-lg font-semibold text-emerald-200">{activeCase.lastUpdate}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-cyan-300" />
                Paramedic Crew
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {activeCase.crew.map((member) => (
                  <div key={member} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    {member}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">{activeCase.ambulanceId} - Patient Cabin Camera</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Patient {activeCase.patientName} en route to {activeCase.destination}. ETA {activeCase.etaMinutes} min.
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs text-rose-100 ring-1 ring-rose-500/30">
                  LIVE
                </div>
              </div>
            </div>

            <WifiCameraFeed
              className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5"
              label={`Patient Cabin Wi-Fi Camera (Ambulance ${activeCase.ambulanceId} - Camera 2)`}
              url={patientCabinCamera.url}
              streamUrl={patientCabinCamera.streamUrl}
              controlUrl={patientCabinCamera.controlUrl}
            />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Stethoscope className="h-5 w-5 text-emerald-300" />
                  Clinical Instruction Console
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <textarea
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    rows={3}
                    className="w-full resize-none bg-transparent text-sm text-white outline-none"
                    placeholder="Type instruction for paramedics"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'Prepare IV access and monitor BP every 2 min.',
                    'Begin oxygen support at 6 L per min.',
                    'Stabilize cervical spine and secure airway.',
                  ].map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => setInstruction(hint)}
                      className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/80 ring-1 ring-white/10 transition hover:bg-white/15"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={sendInstruction}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  <Send className="h-4 w-4" />
                  Send to paramedics
                </button>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm font-semibold text-white">Recent Instructions</div>
                  <div className="mt-3 space-y-3">
                    {instructions.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>Doctor channel</span>
                          <span>{item.time}</span>
                        </div>
                        <div className="mt-2">{item.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5 text-cyan-300" />
                    Paramedic Channel
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Confirm patient consciousness and report GCS.</div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Send updated vitals every 60 seconds.</div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">Prepare handoff notes for hospital intake.</div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <div className="text-lg font-semibold">Arrival Plan</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      Ambulance is {activeCase.etaMinutes} min away from {activeCase.destination}.
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      Notify trauma bay to prepare for critical intake.
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      Lab and imaging pre-alert queued.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
