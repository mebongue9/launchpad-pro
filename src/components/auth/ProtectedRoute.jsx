// /src/components/auth/ProtectedRoute.jsx
// Route wrapper that redirects unauthenticated users to login
// Shows loading state while checking authentication
// RELEVANT FILES: src/hooks/useAuth.js, src/App.jsx

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loading } from '../ui/Loading'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Checking authentication..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
