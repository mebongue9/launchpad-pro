// /src/hooks/useProfiles.js
// Profile CRUD operations hook
// Handles creating, reading, updating, and deleting user business profiles
// RELEVANT FILES: src/lib/supabase.js, src/pages/Profiles.jsx, src/components/profiles/ProfileForm.jsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProfiles() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfiles = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfiles()
  }, [user])

  const createProfile = async (profileData) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...profileData, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setProfiles(prev => [data, ...prev])
    return data
  }

  const updateProfile = async (id, profileData) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfiles(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  const deleteProfile = async (id) => {
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  const uploadFile = async (bucket, file) => {
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return publicUrl
  }

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    uploadFile,
  }
}
