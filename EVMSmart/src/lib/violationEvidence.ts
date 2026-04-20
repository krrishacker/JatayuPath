export type ViolationEvidence = {
  id: string
  image: string
  time: string
  source: string
  note: string
}

const STORAGE_KEY = 'emergency-route-violation-evidence'
export const VIOLATION_EVIDENCE_EVENT = 'violation-evidence-updated'

export function getViolationEvidence(): ViolationEvidence[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as ViolationEvidence[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveViolationEvidence(items: ViolationEvidence[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(VIOLATION_EVIDENCE_EVENT))
}

export function appendViolationEvidence(item: ViolationEvidence) {
  const next = [item, ...getViolationEvidence()].slice(0, 20)
  saveViolationEvidence(next)
  return next
}
