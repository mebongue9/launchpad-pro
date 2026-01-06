// /src/App.jsx
// Root component with routing configuration
// Sets up protected routes and layout structure
// RELEVANT FILES: src/main.jsx, src/components/auth/ProtectedRoute.jsx, src/components/layout/DashboardLayout.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import Audiences from './pages/Audiences'
import ExistingProducts from './pages/ExistingProducts'
import FunnelBuilder from './pages/FunnelBuilder'
import FunnelDetails from './pages/FunnelDetails'
import LeadMagnetBuilder from './pages/LeadMagnetBuilder'
import VisualBuilder from './pages/VisualBuilder'
import History from './pages/History'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes with dashboard layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/audiences" element={<Audiences />} />
        <Route path="/products" element={<ExistingProducts />} />
        <Route path="/funnels" element={<FunnelBuilder />} />
        <Route path="/funnels/:id" element={<FunnelDetails />} />
        <Route path="/lead-magnets" element={<LeadMagnetBuilder />} />
        <Route path="/visual-builder" element={<VisualBuilder />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
