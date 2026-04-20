import type { LatLng } from '../components/SmartMapView'

export type SharedEmergencyVehicle = {
  id: string
  vehicleType: string
  liveLocation: LatLng
  liveAddress: string
  destinationLabel: string | null
  destinationPosition: LatLng | null
  etaMinutes: number | null
  updatedAt: string
}

const STORAGE_KEY = 'emergency-route-live-vehicle'
export const ACTIVE_EMERGENCY_EVENT = 'emergency-route-live-vehicle-updated'

export function setActiveEmergencyVehicle(vehicle: SharedEmergencyVehicle) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle))
  window.dispatchEvent(new CustomEvent(ACTIVE_EMERGENCY_EVENT, { detail: vehicle }))
}

export function getActiveEmergencyVehicle(): SharedEmergencyVehicle | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SharedEmergencyVehicle
    if (!parsed?.id || !parsed?.liveLocation) return null
    return parsed
  } catch {
    return null
  }
}

