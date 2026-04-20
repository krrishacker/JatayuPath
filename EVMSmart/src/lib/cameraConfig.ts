export type CameraConfig = {
  url: string
  streamUrl: string
  controlUrl: string
  proxyStreamUrl: string
  proxyControlUrl: string
}

export const patientCabinCamera: CameraConfig = {
  url: 'http://10.108.106.40',
  streamUrl: 'http://10.108.106.40:81/stream',
  controlUrl: 'http://10.108.106.40',
  proxyStreamUrl: '/camera-stream/stream',
  proxyControlUrl: '/camera',
}

export function getPatientCabinCameraConfig(): CameraConfig {
  if (typeof window === 'undefined') return patientCabinCamera

  const shouldProxy = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  if (!shouldProxy) return patientCabinCamera

  return {
    ...patientCabinCamera,
    streamUrl: patientCabinCamera.proxyStreamUrl,
    controlUrl: patientCabinCamera.proxyControlUrl,
  }
}
