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
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('audiences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAudiences(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAudiences()
  }, [user])

  const createAudience = async (audienceData) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('audiences')
      .insert({ ...audienceData, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setAudiences(prev => [data, ...prev])
    return data
  }

  const updateAudience = async (id, audienceData) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('audiences')
      .update(audienceData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    setAudiences(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  const deleteAudience = async (id) => {
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('audiences')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
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
