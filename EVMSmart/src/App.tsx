import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DriverDashboardPage from './pages/DriverDashboardPage'
import TrafficControlDashboardPage from './pages/TrafficControlDashboardPage'
import HospitalCoordinatorDashboardPage from './pages/HospitalCoordinatorDashboardPage'
import RoadAuthorityDashboardPage from './pages/RoadAuthorityDashboardPage'
import GoogleMapsRoutePage from './pages/GoogleMapsRoutePage'
import { getSessionRole } from './lib/sessionRole'

export default function App() {
  const role = getSessionRole()
  const defaultPath =
    role === 'Ambulance Driver'
      ? '/driver'
      : role === 'Traffic Control Officer'
        ? '/traffic'
        : role === 'Hospital Coordinator'
          ? '/hospital'
          : role === 'Road Authority'
            ? '/road-authority'
            : '/login'

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/driver" element={<DriverDashboardPage />} />
      <Route path="/traffic" element={<TrafficControlDashboardPage />} />
      <Route path="/hospital" element={<HospitalCoordinatorDashboardPage />} />
      <Route path="/road-authority" element={<RoadAuthorityDashboardPage />} />
      <Route path="/route-planner" element={<GoogleMapsRoutePage />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}
