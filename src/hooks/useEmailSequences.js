// /src/hooks/useEmailSequences.js
// Hook for managing email sequence generation and retrieval
// Generates Maria Wendt style email sequences for funnels
// RELEVANT FILES: netlify/functions/generate-emails-background.js, src/pages/FunnelBuilder.jsx

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useEmailSequences() {
  const { user } = useAuth()
  const [sequences, setSequences] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Fetch email sequences for a funnel
  const fetchSequences = useCallback(async (funnelId) => {
    if (!user || !funnelId) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('user_id', user.id)
        .order('sequence_type')

      if (fetchError) throw fetchError
      setSequences(data || [])
      return data || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate email sequences for a funnel
  const generateSequences = useCallback(async (funnelId, language = 'English') => {
    if (!user || !funnelId) {
      throw new Error('User and funnel ID required')
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/generate-emails-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnelId,
          user_id: user.id,
          language
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate emails')
      }

      const result = await response.json()
      setSequences(result.sequences || [])
      return result.sequences
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [user])

  // Delete email sequences for a funnel
  const deleteSequences = useCallback(async (funnelId) => {
    if (!user || !funnelId) return

    try {
      const { error: deleteError } = await supabase
        .from('email_sequences')
        .delete()
        .eq('funnel_id', funnelId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setSequences([])
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  // Get a specific sequence by type
  const getSequenceByType = useCallback((type) => {
    return sequences.find(s => s.sequence_type === type)
  }, [sequences])

  return {
    sequences,
    loading,
    generating,
    error,
    fetchSequences,
    generateSequences,
    deleteSequences,
    getSequenceByType,
    leadMagnetSequence: getSequenceByType('lead_magnet'),
    frontEndSequence: getSequenceByType('front_end')
  }
}
