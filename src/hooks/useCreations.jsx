// /src/hooks/useCreations.jsx
// Hook for creations CRUD operations
// Manages visual outputs saved to database
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/pages/History.jsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCreations() {
  const { user } = useAuth()
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  async function fetchCreations() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creations')
        .select('*, profiles(name, business_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCreations(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveCreation(creationData) {
    try {
      const { data, error } = await supabase
        .from('creations')
        .insert({
          user_id: user.id,
          ...creationData
        })
        .select()
        .single()

      if (error) throw error
      await fetchCreations()
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateCreation(id, updates) {
    try {
      const { error } = await supabase
        .from('creations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCreations()
    } catch (err) {
      throw err
    }
  }

  async function deleteCreation(id) {
    try {
      const { error } = await supabase
        .from('creations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCreations()
    } catch (err) {
      throw err
    }
  }

  async function uploadToStorage(bucket, file) {
    try {
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
    } catch (err) {
      throw err
    }
  }

  return {
    creations,
    loading,
    error,
    fetchCreations,
    saveCreation,
    updateCreation,
    deleteCreation,
    uploadToStorage
  }
}
