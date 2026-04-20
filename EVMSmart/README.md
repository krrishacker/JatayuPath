# Emergency Route AI

React + Vite + Tailwind project powered by Google Maps across the route planner and dashboard maps.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example` and set your Google Maps API key:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. In Google Cloud, enable these APIs:

- Maps JavaScript API
- Directions API
- Geocoding API
- Places API

4. Start the app:

```bash
npm run dev
```

The dev server prefers `http://localhost:5174/`.

## Route Planner

- Page route: `/route-planner`
- Map component: `src/components/GoogleMapRoutePlanner.tsx`
- API loader: `src/lib/googleMapsLoader.ts`

## Features

- Responsive Google Map rendered with the Google Maps JavaScript API
- Current location from the browser Geolocation API
- Driver and control-room dashboards render live Google Maps overlays
- Marker placed at the user's current location
- Destination input for address or landmark search
- Google Places autocomplete and nearby hospital search
- Shortest drivable route selected from Google Directions alternatives
- Real-time traffic layer enabled on the map
