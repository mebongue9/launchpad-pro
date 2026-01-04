// /src/hooks/useAudiences.js
// Audience CRUD operations hook
// Handles creating, reading, updating, and deleting target audience definitions
// RELEVANT FILES: src/lib/supabase.js, src/pages/Audiences.jsx, src/components/audiences/AudienceForm.jsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAudiences() {
  const { user } = useAuth()
  const [audiences, setAudiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAudiences = async () => {
    if (!user) {
      console.log('🔄 [AUDIENCES] Skipping fetch - no user authenticated')
      return
    }

    console.log('🔄 [AUDIENCES] Fetching audiences for user:', user.id)
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('audiences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ [AUDIENCES] Fetch error:', fetchError.message)
      setError(fetchError.message)
    } else {
      console.log('✅ [AUDIENCES] Fetched', data?.length || 0, 'audiences')
      setAudiences(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    console.log('🚀 [AUDIENCES] Hook initialized, user:', user?.id || 'none')
    fetchAudiences()
  }, [user])

  const createAudience = async (audienceData) => {
    if (!user) {
      console.error('❌ [AUDIENCES] Create failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('📥 [AUDIENCES] Creating audience:', audienceData.name)
    const { data, error } = await supabase
      .from('audiences')
      .insert({ ...audienceData, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('❌ [AUDIENCES] Create error:', error.message)
      throw error
    }
    console.log('✅ [AUDIENCES] Created audience:', data.id)
    setAudiences(prev => [data, ...prev])
    return data
  }

  const updateAudience = async (id, audienceData) => {
    if (!user) {
      console.error('❌ [AUDIENCES] Update failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('🔄 [AUDIENCES] Updating audience:', id)
    const { data, error } = await supabase
      .from('audiences')
      .update(audienceData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [AUDIENCES] Update error:', error.message)
      throw error
    }
    console.log('✅ [AUDIENCES] Updated audience:', id)
    setAudiences(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  const deleteAudience = async (id) => {
    if (!user) {
      console.error('❌ [AUDIENCES] Delete failed - not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('🔄 [AUDIENCES] Deleting audience:', id)
    const { error } = await supabase
      .from('audiences')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ [AUDIENCES] Delete error:', error.message)
      throw error
    }
    console.log('✅ [AUDIENCES] Deleted audience:', id)
    setAudiences(prev => prev.filter(a => a.id !== id))
  }

  return {
    audiences,
    loading,
    error,
    fetchAudiences,
    createAudience,
    updateAudience,
    deleteAudience,
  }
}
