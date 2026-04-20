import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Camera, CameraOff, Loader2, ScanLine, Video } from 'lucide-react'

export type LiveCameraFeedHandle = {
  startCamera: () => Promise<void>
  captureFrame: () => void
}

const LiveCameraFeed = forwardRef<LiveCameraFeedHandle, {
  label?: string
  className?: string
  onError?: (msg: string) => void
  autoStart?: boolean
  onCapture?: (imageDataUrl: string) => void
  preferredCamera?: 'internal' | 'external' | 'any'
  captureLabel?: string
}>((props, ref) => {
  const { label = 'Camera Feed', className, onError, autoStart = true, onCapture, preferredCamera = 'any', captureLabel = 'Capture' } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const preferredAppliedRef = useRef(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'live' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [captureFlash, setCaptureFlash] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  const isInternalCamera = useCallback((labelText: string) => /integrated|internal|built-?in|facetime|laptop|front|hd webcam/i.test(labelText), [])
  const isExternalCamera = useCallback((labelText: string) => /usb|external|logitech|brio|capture|cam link|uvc|webcam/i.test(labelText) && !isInternalCamera(labelText), [isInternalCamera])

  const choosePreferredDevice = useCallback(
    (videoDevices: MediaDeviceInfo[]) => {
      if (preferredCamera === 'any') return videoDevices[0]
      if (preferredCamera === 'internal') {
        return videoDevices.find((device) => isInternalCamera(device.label)) ?? videoDevices[0]
      }
      return videoDevices.find((device) => isExternalCamera(device.label)) ?? videoDevices[1] ?? videoDevices[0]
    },
    [isExternalCamera, isInternalCamera, preferredCamera],
  )

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = allDevices.filter((device) => device.kind === 'videoinput')
    setDevices(videoDevices)
    return videoDevices
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera not supported in this browser.'
      setErrorMsg(msg)
      setStatus('error')
      onError?.(msg)
      return
    }

    setStatus('loading')
    setErrorMsg(null)
    stopStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      const currentTrack = stream.getVideoTracks()[0]
      const activeDeviceId = currentTrack?.getSettings().deviceId ?? deviceId ?? ''
      const videoDevices = await refreshDevices()
      if (activeDeviceId) {
        setSelectedDeviceId(activeDeviceId)
      }

      if (!preferredAppliedRef.current && videoDevices.length > 1) {
        const preferredDevice = choosePreferredDevice(videoDevices)
        if (preferredDevice && preferredDevice.deviceId && preferredDevice.deviceId !== activeDeviceId) {
          preferredAppliedRef.current = true
          await startCamera(preferredDevice.deviceId)
          return
        }
      }

      setStatus('live')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied.'
      setErrorMsg(msg)
      setStatus('error')
      onError?.(msg)
    }
  }, [choosePreferredDevice, onError, refreshDevices, stopStream])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || status !== 'live') return

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      onError?.('Snapshot capture failed.')
      return
    }

    context.drawImage(video, 0, 0, width, height)
    onCapture?.(canvas.toDataURL('image/jpeg', 0.92))
    setCaptureFlash(true)
    window.setTimeout(() => setCaptureFlash(false), 180)
  }, [onCapture, onError, status])

  useImperativeHandle(ref, () => ({ startCamera, captureFrame }), [captureFrame, startCamera])

  useEffect(() => {
    if (autoStart) {
      preferredAppliedRef.current = false
      void startCamera()
    }
    return () => stopStream()
  }, [autoStart, startCamera, stopStream])

  useEffect(() => {
    const handleDeviceChange = () => {
      void refreshDevices()
    }

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange)
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange)
  }, [refreshDevices])

  return (
    <div className={className}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Video className="h-4.5 w-4.5 text-amber-300" />
          <div className="text-sm font-semibold text-white">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'live' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live
            </span>
          ) : null}
          {status === 'live' ? (
            <button
              type="button"
              onClick={captureFrame}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-2 text-xs font-medium text-white ring-1 ring-rose-300/30 transition hover:bg-rose-400"
            >
              <ScanLine className="h-4 w-4" />
              {captureLabel}
            </button>
          ) : null}
          {status !== 'loading' ? (
            <button
              type="button"
              onClick={() => {
                preferredAppliedRef.current = false
                void startCamera(selectedDeviceId || undefined)
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white/85 ring-1 ring-white/10 transition hover:bg-white/15"
            >
              {status === 'live' ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              {status === 'live' ? 'Restart' : 'Enable camera'}
            </button>
          ) : null}
        </div>
      </div>

      {devices.length > 1 ? (
        <div className="border-b border-white/10 px-4 py-3">
          <label className="block">
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/45">Camera Source</div>
            <select
              value={selectedDeviceId}
              onChange={(event) => {
                const nextDeviceId = event.target.value
                setSelectedDeviceId(nextDeviceId)
                preferredAppliedRef.current = true
                void startCamera(nextDeviceId)
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId} className="text-slate-900">
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="relative h-[420px] overflow-hidden rounded-b-[28px] bg-black">
        {captureFlash ? <div className="pointer-events-none absolute inset-0 z-10 bg-white/35" /> : null}

        {status === 'loading' ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-300" />
              <div className="text-sm text-white/70">Requesting camera access...</div>
            </div>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6">
            <div className="max-w-sm text-center">
              <CameraOff className="mx-auto h-12 w-12 text-rose-300" />
              <div className="mt-3 text-sm font-medium text-white">Camera access failed</div>
              <div className="mt-2 text-xs text-white/60">{errorMsg}</div>
              <div className="mt-4 text-xs text-white/50">Allow camera in browser settings and click "Enable camera" to retry.</div>
            </div>
          </div>
        ) : null}

        {status === 'idle' ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="flex flex-col items-center gap-3 rounded-3xl bg-white/10 px-8 py-6 ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <Camera className="h-14 w-14 text-white/60" />
              <div className="text-sm font-medium text-white/85">Enable physical camera</div>
              <div className="text-xs text-white/50">Use it to capture violation evidence on route</div>
            </button>
          </div>
        ) : null}

        {status === 'live' ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" /> : null}
      </div>
    </div>
  )
})

LiveCameraFeed.displayName = 'LiveCameraFeed'

export default LiveCameraFeed
