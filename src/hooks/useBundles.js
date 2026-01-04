// /src/hooks/useBundles.js
// Hook for managing bundle listings (4-product bundles at discount)
// Creates and retrieves bundle data for funnels
// RELEVANT FILES: netlify/functions/generate-bundle-listings.js, src/components/funnel/BundlePreview.jsx

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useBundles() {
  const { user } = useAuth()
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Fetch bundle for a funnel
  const fetchBundle = useCallback(async (funnelId) => {
    if (!user || !funnelId) return null

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('bundles')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw fetchError
      }

      setBundle(data || null)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate bundle for a funnel
  const generateBundle = useCallback(async (funnelId, language = 'English') => {
    if (!user || !funnelId) {
      throw new Error('User and funnel ID required')
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/generate-bundle-listings', {
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
        throw new Error(errorData.error || 'Failed to generate bundle')
      }

      const result = await response.json()
      setBundle(result.bundle)
      return result.bundle
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [user])

  // Delete bundle for a funnel
  const deleteBundle = useCallback(async (funnelId) => {
    if (!user || !funnelId) return

    try {
      const { error: deleteError } = await supabase
        .from('bundles')
        .delete()
        .eq('funnel_id', funnelId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setBundle(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  return {
    bundle,
    loading,
    generating,
    error,
    fetchBundle,
    generateBundle,
    deleteBundle
  }
}
