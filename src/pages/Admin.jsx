// /src/pages/Admin.jsx
// Admin dashboard for user management
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAdmin } from '../hooks/useAdmin'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/ui/Toast'
import { UserList } from '../components/admin/UserList'
import { CreateUserModal } from '../components/admin/CreateUserModal'
import { EditUserModal } from '../components/admin/EditUserModal'
import { UserPlus, Users, Shield, RefreshCw } from 'lucide-react'

export default function Admin() {
  const { user } = useAuth()
  const {
    users,
    usersLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  } = useAdmin()
  const { addToast } = useToast()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (email, password, makeAdmin) => {
    try {
      await createUser(email, password, makeAdmin)
      addToast(`User ${email} created successfully`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
      throw err
    }
  }

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      await updateUser(userId, updates)
      addToast('User updated successfully', 'success')
    } catch (err) {
      addToast(err.message, 'error')
      throw err
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
      addToast('User deleted successfully', 'success')
    } catch (err) {
      addToast(err.message, 'error')
      throw err
    }
  }

  // Calculate stats
  const totalUsers = users.length
  const adminCount = users.filter(u => u.is_admin).length
  const regularCount = totalUsers - adminCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-gray-500 mt-1">Manage users and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchUsers()}
            disabled={usersLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
            <p className="text-sm text-gray-500">Admins</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{regularCount}</p>
            <p className="text-sm text-gray-500">Regular Users</p>
          </div>
        </Card>
      </div>

      {/* Error display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* User List */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
        <UserList
          users={users}
          currentUserEmail={user?.email}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          loading={usersLoading}
        />
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSubmit={handleUpdateUser}
        user={editingUser}
      />
    </div>
  )
}
