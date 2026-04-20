import type { LatLng } from './MapView'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function zoomToDelta(zoom: number) {
  const normalized = clamp(zoom, 2, 18)
  return 0.5 / Math.pow(2, normalized - 10)
}

export default function OpenStreetMapFallback(props: {
  center: LatLng
  zoom?: number
  className?: string
  label?: string
}) {
  const { center, zoom = 13, className, label } = props
  const delta = zoomToDelta(zoom)
  const left = clamp(center.lng - delta, -180, 180)
  const right = clamp(center.lng + delta, -180, 180)
  const bottom = clamp(center.lat - delta, -85, 85)
  const top = clamp(center.lat + delta, -85, 85)

  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${left},${bottom},${right},${top}`,
  )}&layer=mapnik&marker=${encodeURIComponent(`${center.lat},${center.lng}`)}`

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <iframe title={label ?? 'OpenStreetMap'} src={iframeSrc} className="h-full w-full border-0" loading="lazy" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] text-slate-700 shadow">
        OpenStreetMap fallback active
      </div>
    </div>
  )
}
