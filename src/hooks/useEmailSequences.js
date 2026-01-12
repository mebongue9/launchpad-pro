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

  // Fetch email sequences from funnel JSONB and lead_magnets table
  // BUG FIX: Emails are stored as arrays in JSONB, not in separate email_sequences table
  const fetchSequences = useCallback(async (funnelId) => {
    if (!user || !funnelId) return []

    setLoading(true)
    setError(null)

    try {
      // Fetch front-end emails from funnel JSONB
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('front_end')
        .eq('id', funnelId)
        .single()

      if (funnelError) throw funnelError

      // Fetch lead magnet emails from lead_magnets table
      const { data: leadMagnet } = await supabase
        .from('lead_magnets')
        .select('email_sequence')
        .eq('funnel_id', funnelId)
        .single()

      // Build sequences array in the format the UI expects
      const sequences = []

      // Lead magnet emails (stored as array in lead_magnets.email_sequence)
      if (leadMagnet?.email_sequence && Array.isArray(leadMagnet.email_sequence)) {
        const lmEmails = leadMagnet.email_sequence
        sequences.push({
          sequence_type: 'lead_magnet',
          email_1_subject: lmEmails[0]?.subject || '',
          email_1_preview: lmEmails[0]?.preview || '',
          email_1_body: lmEmails[0]?.body || '',
          email_2_subject: lmEmails[1]?.subject || '',
          email_2_preview: lmEmails[1]?.preview || '',
          email_2_body: lmEmails[1]?.body || '',
          email_3_subject: lmEmails[2]?.subject || '',
          email_3_preview: lmEmails[2]?.preview || '',
          email_3_body: lmEmails[2]?.body || ''
        })
      }

      // Front-end emails (stored as array in funnel.front_end.email_sequence)
      if (funnel?.front_end?.email_sequence && Array.isArray(funnel.front_end.email_sequence)) {
        const feEmails = funnel.front_end.email_sequence
        sequences.push({
          sequence_type: 'front_end',
          email_1_subject: feEmails[0]?.subject || '',
          email_1_preview: feEmails[0]?.preview || '',
          email_1_body: feEmails[0]?.body || '',
          email_2_subject: feEmails[1]?.subject || '',
          email_2_preview: feEmails[1]?.preview || '',
          email_2_body: feEmails[1]?.body || '',
          email_3_subject: feEmails[2]?.subject || '',
          email_3_preview: feEmails[2]?.preview || '',
          email_3_body: feEmails[2]?.body || ''
        })
      }

      setSequences(sequences)
      return sequences
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
