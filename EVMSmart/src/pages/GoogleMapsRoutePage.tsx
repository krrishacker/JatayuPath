import GoogleMapRoutePlanner from '../components/GoogleMapRoutePlanner'

export default function GoogleMapsRoutePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_28%),linear-gradient(180deg,#e0f2fe_0%,#f8fafc_42%,#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <GoogleMapRoutePlanner />
      </div>
    </main>
  )
}
