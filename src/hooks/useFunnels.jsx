// /src/hooks/useFunnels.jsx
// Hook for funnel CRUD operations and AI generation
// Manages funnels data from Supabase
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, netlify/functions/generate-funnel.js

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFunnels() {
  const { user } = useAuth()
  const [funnels, setFunnels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchFunnels()
    }
  }, [user])

  async function fetchFunnels() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('funnels')
        .select('*, profiles(name, business_name), audiences(name), existing_products(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFunnels(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateFunnel(profile, audience, existingProduct = null) {
    try {
      const response = await fetch('/.netlify/functions/generate-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          audience,
          existing_product: existingProduct
        })
      })

      if (!response.ok) {
        // Handle non-JSON error responses (like HTML from 504 timeout)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate funnel')
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`)
        }
      }

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  async function saveFunnel(funnelData, profileId, audienceId, existingProductId = null, language = 'English') {
    try {
      // Only 4 products: front_end, bump, upsell_1, upsell_2 (user's existing product is final destination)
      const { data, error } = await supabase
        .from('funnels')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          audience_id: audienceId,
          existing_product_id: existingProductId,
          name: funnelData.funnel_name,
          front_end: funnelData.front_end,
          bump: funnelData.bump,
          upsell_1: funnelData.upsell_1,
          upsell_2: funnelData.upsell_2,
          language: language,
          // No upsell_3 - user's existing product is the final destination
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error
      await fetchFunnels()
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateFunnel(id, updates) {
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchFunnels()
    } catch (err) {
      throw err
    }
  }

  async function deleteFunnel(id) {
    try {
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchFunnels()
    } catch (err) {
      throw err
    }
  }

  async function generateProductContent(product, profile, audience, nextProduct = null) {
    try {
      const response = await fetch('/.netlify/functions/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          profile,
          audience,
          next_product: nextProduct
        })
      })

      if (!response.ok) {
        // Handle non-JSON error responses (like HTML from 504 timeout)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate content')
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`)
        }
      }

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  return {
    funnels,
    loading,
    error,
    fetchFunnels,
    generateFunnel,
    saveFunnel,
    updateFunnel,
    deleteFunnel,
    generateProductContent
  }
}
