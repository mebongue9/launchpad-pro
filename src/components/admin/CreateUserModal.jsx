// /src/components/admin/CreateUserModal.jsx
// Modal for creating new users with optional admin flag
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, RefreshCw, Eye, EyeOff } from 'lucide-react'

export function CreateUserModal({ isOpen, onClose, onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [makeAdmin, setMakeAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    // Use cryptographically secure random values
    const array = new Uint32Array(12)
    crypto.getRandomValues(array)
    const result = Array.from(array, x => chars[x % chars.length]).join('')
    setPassword(result)
    setShowPassword(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onSubmit(email, password, makeAdmin)
      // Reset form
      setEmail('')
      setPassword('')
      setMakeAdmin(false)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setMakeAdmin(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={generatePassword}
                title="Generate random password"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Share this password with the user. They should change it after first login.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="makeAdmin"
              checked={makeAdmin}
              onChange={(e) => setMakeAdmin(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="makeAdmin" className="text-sm text-gray-700">
              Make this user an Admin
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
