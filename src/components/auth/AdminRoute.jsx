// /src/components/auth/AdminRoute.jsx
// Route wrapper that requires admin status
// Redirects non-admins to dashboard
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'
import { Loading } from '../ui/Loading'

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Verifying admin access..." />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
