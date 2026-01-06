// /src/components/admin/EditUserModal.jsx
// Modal for editing user email and admin status
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X } from 'lucide-react'

export function EditUserModal({ isOpen, onClose, onSubmit, user }) {
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setIsAdmin(user.is_admin || false)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onSubmit(user.id, {
        email: email !== user.email ? email : undefined,
        is_admin: isAdmin
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen || !user) return null

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
          <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isAdmin" className="text-sm text-gray-700">
              Admin
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Admins can create, edit, and delete users.
          </p>

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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
