import MapView, { type LatLng, type MapAmbulance, type MapCamera, type MapCongestion, type MapPlace } from './MapView'

export type { LatLng, MapAmbulance, MapCamera, MapCongestion, MapPlace }

export default function SmartMapView(props: {
  center: LatLng
  zoom?: number
  ambulances?: MapAmbulance[]
  destination?: { label: string; position: LatLng }
  route?: LatLng[]
  congestion?: MapCongestion[]
  cameras?: MapCamera[]
  places?: MapPlace[]
  followPosition?: LatLng | null
  className?: string
}) {
  return <MapView {...props} />
}
