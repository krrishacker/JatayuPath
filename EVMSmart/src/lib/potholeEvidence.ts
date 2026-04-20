export type PotholeEvidence = {
  id: string
  image: string
  time: string
  source: string
  note: string
}

const STORAGE_KEY = 'emergency-route-pothole-evidence'
export const POTHOLE_EVIDENCE_EVENT = 'pothole-evidence-updated'

export function getPotholeEvidence(): PotholeEvidence[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as PotholeEvidence[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePotholeEvidence(items: PotholeEvidence[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(POTHOLE_EVIDENCE_EVENT))
}

export function appendPotholeEvidence(item: PotholeEvidence) {
  const next = [item, ...getPotholeEvidence()].slice(0, 20)
  savePotholeEvidence(next)
  return next
}
