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
    if (!user) {
      console.log('🔄 [PROFILES] Skipping fetch - no user authenticated')
      return
    }

    console.log('🔄 [PROFILES] Fetching profiles for user:', user.id)
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ [PROFILES] Fetch error:', fetchError.message)
      setError(fetchError.message)
    } else {
      console.log('✅ [PROFILES] Fetched', data?.length || 0, 'profiles')
      setProfiles(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    console.log('🚀 [PROFILES] Hook initialized, user:', user?.id || 'none')
    fetchProfiles()
  }, [user])

  const createProfile = async (profileData) => {
    if (!user) {
      console.error('❌ [PROFILES] Create failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('📥 [PROFILES] Creating profile:', profileData.name || profileData.business_name)
    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...profileData, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('❌ [PROFILES] Create error:', error.message)
      throw error
    }
    console.log('✅ [PROFILES] Created profile:', data.id)
    setProfiles(prev => [data, ...prev])
    return data
  }

  const updateProfile = async (id, profileData) => {
    if (!user) {
      console.error('❌ [PROFILES] Update failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('🔄 [PROFILES] Updating profile:', id)
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PROFILES] Update error:', error.message)
      throw error
    }
    console.log('✅ [PROFILES] Updated profile:', id)
    setProfiles(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  const deleteProfile = async (id) => {
    if (!user) {
      console.error('❌ [PROFILES] Delete failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('🔄 [PROFILES] Deleting profile:', id)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ [PROFILES] Delete error:', error.message)
      throw error
    }
    console.log('✅ [PROFILES] Deleted profile:', id)
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  const uploadFile = async (bucket, file) => {
    if (!user) {
      console.error('❌ [PROFILES] Upload failed - not authenticated')
      throw new Error('Not authenticated')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    console.log('📥 [PROFILES] Uploading file to bucket:', bucket, 'filename:', fileName)
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) {
      console.error('❌ [PROFILES] Upload error:', uploadError.message)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    console.log('✅ [PROFILES] File uploaded, URL:', publicUrl)
    return publicUrl
  }

  // Update favorite languages for a profile
  const updateFavoriteLanguages = async (profileId, languages) => {
    if (!user) {
      console.error('❌ [PROFILES] Update languages failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('🔄 [PROFILES] Updating favorite languages for profile:', profileId, 'languages:', languages)
    const { data, error } = await supabase
      .from('profiles')
      .update({ favorite_languages: languages })
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PROFILES] Update languages error:', error.message)
      throw error
    }
    console.log('✅ [PROFILES] Updated languages for profile:', profileId)
    setProfiles(prev => prev.map(p => p.id === profileId ? data : p))
    return data
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
    updateFavoriteLanguages,
  }
}
