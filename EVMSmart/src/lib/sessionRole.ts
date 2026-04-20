export type SessionRole = 'Ambulance Driver' | 'Traffic Control Officer' | 'Hospital Coordinator' | 'Road Authority'

const STORAGE_KEY = 'emergency-route-role'

export function setSessionRole(role: SessionRole) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, role)
}

export function getSessionRole(): SessionRole | null {
  if (typeof window === 'undefined') return null
  const role = window.localStorage.getItem(STORAGE_KEY)
  if (
    role === 'Ambulance Driver' ||
    role === 'Traffic Control Officer' ||
    role === 'Hospital Coordinator' ||
    role === 'Road Authority'
  ) {
    return role
  }
  return null
}
