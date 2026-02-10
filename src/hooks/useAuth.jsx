// /src/hooks/useAuth.js
// Authentication hook providing login, signup, logout, and session management
// Uses Supabase Auth with email/password
// RELEVANT FILES: src/lib/supabase.js, src/components/auth/ProtectedRoute.jsx, src/App.jsx

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    // Only update user state if user ID actually changes (not just token refresh)
    // This prevents re-renders when switching browser tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null
        setUser(currentUser => {
          const currentUserId = currentUser?.id ?? null
          // Only update if user ID changed (sign in/out), not token refresh
          if (currentUserId !== newUserId) {
            return session?.user ?? null
          }
          // Token refresh with same user - don't update to avoid re-renders
          return currentUser
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
