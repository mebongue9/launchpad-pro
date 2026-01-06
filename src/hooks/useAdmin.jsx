// /src/hooks/useAdmin.jsx
// Hook for admin functionality - check status and manage users
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if current user is an admin
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const response = await fetch('/.netlify/functions/admin-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setIsAdmin(data.is_admin || false)
    } catch (err) {
      console.error('[useAdmin] Error checking admin status:', err)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return

    setUsersLoading(true)
    setError(null)

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch('/.netlify/functions/admin-list-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
    } catch (err) {
      console.error('[useAdmin] Error fetching users:', err)
      setError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }, [isAdmin])

  // Create a new user
  const createUser = useCallback(async (email, password, makeAdmin = false) => {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const response = await fetch('/.netlify/functions/admin-create-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        make_admin: makeAdmin
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user')
    }

    // Refresh user list
    await fetchUsers()

    return data.user
  }, [fetchUsers])

  // Update a user
  const updateUser = useCallback(async (userId, updates) => {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const response = await fetch('/.netlify/functions/admin-update-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        new_email: updates.email,
        make_admin: updates.is_admin
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user')
    }

    // Refresh user list
    await fetchUsers()

    return data
  }, [fetchUsers])

  // Delete a user
  const deleteUser = useCallback(async (userId) => {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const response = await fetch('/.netlify/functions/admin-delete-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user')
    }

    // Refresh user list
    await fetchUsers()

    return data
  }, [fetchUsers])

  // Check admin status on mount and when user changes
  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  return {
    isAdmin,
    loading,
    users,
    usersLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    refreshAdminStatus: checkAdminStatus
  }
}
