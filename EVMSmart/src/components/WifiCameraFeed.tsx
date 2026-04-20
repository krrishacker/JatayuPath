import { ExternalLink, RefreshCw, Router, Video } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export default function WifiCameraFeed(props: {
  label?: string
  url: string
  streamUrl?: string
  controlUrl?: string
  className?: string
}) {
  const { label = 'Wi-Fi Camera', url, streamUrl, controlUrl: controlUrlProp, className } = props
  const [streamIndex, setStreamIndex] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [failed, setFailed] = useState(false)

  const { controlUrl, streamSources } = useMemo(() => {
    const normalized = url.replace(/\/+$/, '')
    return {
      controlUrl: controlUrlProp?.replace(/\/+$/, '') ?? normalized,
      streamSources: [
        ...(streamUrl ? [{ kind: 'stream' as const, url: streamUrl.replace(/\/+$/, '') }] : []),
        { kind: 'stream' as const, url: `${normalized}:81/stream` },
        { kind: 'stream' as const, url: `${normalized}/stream` },
        { kind: 'stream' as const, url: `${normalized}/mjpeg/1` },
        { kind: 'stream' as const, url: `${normalized}/video` },
        { kind: 'stream' as const, url: `${normalized}/videofeed` },
        { kind: 'snapshot' as const, url: `${normalized}/capture` },
        { kind: 'snapshot' as const, url: `${normalized}/shot.jpg` },
        { kind: 'snapshot' as const, url: `${normalized}/jpg` },
      ],
    }
  }, [controlUrlProp, streamUrl, url])

  const activeSource = streamSources[Math.min(streamIndex, streamSources.length - 1)]
  const activeStreamUrl = `${activeSource.url}${activeSource.url.includes('?') ? '&' : '?'}t=${reloadKey}`

  useEffect(() => {
    if (activeSource.kind !== 'snapshot' || failed) return

    const intervalId = window.setInterval(() => {
      setReloadKey((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [activeSource.kind, failed])

  return (
    <div className={className}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Video className="h-4.5 w-4.5 text-amber-300" />
          <div className="text-sm font-semibold text-white">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={controlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white/85 ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <ExternalLink className="h-4 w-4" />
            Controls
          </a>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setReloadKey((current) => current + 1)
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white/85 ring-1 ring-white/10 transition hover:bg-white/15"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative h-[420px] overflow-hidden rounded-b-[28px] bg-black">
        {!failed ? (
          <img
            key={activeStreamUrl}
            src={activeStreamUrl}
            alt={label}
            className="h-full w-full object-cover"
            onLoad={() => setFailed(false)}
            onError={() => {
              setStreamIndex((current) => {
                const nextIndex = current + 1
                if (nextIndex >= streamSources.length) {
                  setFailed(true)
                  return current
                }
                return nextIndex
              })
            }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center">
            <div>
              <div className="text-sm font-semibold text-white">Wi-Fi camera stream unavailable</div>
              <div className="mt-2 text-xs text-white/60">
                Tried common stream endpoints for {controlUrl}. Open camera controls and verify the stream path on the device.
              </div>
              <div className="mt-4 flex justify-center gap-3">
                <a
                  href={controlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white ring-1 ring-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open controls
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFailed(false)
                    setStreamIndex(0)
                    setReloadKey((current) => current + 1)
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-cyan-400 px-3 py-2 text-xs font-medium text-slate-950"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-2 text-[11px] text-white ring-1 ring-white/10 backdrop-blur">
          <span className="inline-flex items-center gap-2">
            <Router className="h-3.5 w-3.5 text-cyan-300" />
            Wi-Fi {activeSource.kind === 'snapshot' ? 'snapshot' : 'stream'}: {activeSource.url}
          </span>
        </div>
      </div>
    </div>
  )
}
