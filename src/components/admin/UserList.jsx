// /src/components/admin/UserList.jsx
// Table component displaying all users with actions
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Pencil, Trash2, Shield, User } from 'lucide-react'

export function UserList({ users, currentUserEmail, onEdit, onDelete, loading }) {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.email}? This cannot be undone.`)) {
      return
    }

    setDeletingId(user.id)
    try {
      await onDelete(user.id)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading users...
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.email.toLowerCase() === currentUserEmail?.toLowerCase()

            return (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{user.email}</span>
                    {isCurrentUser && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    user.is_admin
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.is_admin ? (
                      <>
                        <Shield className="w-3 h-3" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3" />
                        User
                      </>
                    )}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {formatDate(user.created_at)}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {formatDate(user.last_sign_in_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!isCurrentUser && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
