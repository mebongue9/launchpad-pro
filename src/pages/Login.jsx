// /src/pages/Login.jsx
// Login page with branding and auth form
// Redirects to dashboard on successful login
// RELEVANT FILES: src/components/auth/LoginForm.jsx, src/App.jsx

import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Launchpad Pro
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          AI-Powered Funnel Builder for Coaches
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Sign in to your account
          </h2>
          <LoginForm onSuccess={() => navigate('/dashboard')} />
        </div>
      </div>
    </div>
  )
}
