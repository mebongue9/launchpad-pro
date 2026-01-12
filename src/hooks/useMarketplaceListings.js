// /src/hooks/useMarketplaceListings.js
// Hook for generating and managing marketplace listings
// Creates Etsy/Gumroad-ready titles, descriptions, and tags
// RELEVANT FILES: netlify/functions/generate-marketplace-listings.js, src/components/funnel/MarketplaceListings.jsx

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMarketplaceListings() {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Generate marketplace listings for a funnel
  const generateListings = useCallback(async (funnelId, productLevel = null, language = 'English') => {
    if (!user || !funnelId) {
      throw new Error('User and funnel ID required')
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/generate-marketplace-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnelId,
          user_id: user.id,
          product_level: productLevel,
          language
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate listings')
      }

      const result = await response.json()
      return result.listings
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [user])

  // Fetch marketplace data from funnel JSONB columns
  // Data is stored as: front_end.marketplace_listing, bump.marketplace_listing, etc.
  const fetchListings = useCallback(async (funnelId) => {
    if (!user || !funnelId) return null

    try {
      const { data, error: fetchError } = await supabase
        .from('funnels')
        .select('front_end, bump, upsell_1, upsell_2')
        .eq('id', funnelId)
        .single()

      if (fetchError) throw fetchError

      // Extract marketplace_listing from each product's JSONB
      const listings = {}
      const levels = ['front_end', 'bump', 'upsell_1', 'upsell_2']

      for (const level of levels) {
        const product = data[level]
        if (product?.marketplace_listing) {
          const ml = product.marketplace_listing
          listings[level] = {
            marketplace_title: ml.marketplace_title || '',
            marketplace_description: ml.marketplace_description || '',
            marketplace_tags: Array.isArray(ml.marketplace_tags)
              ? ml.marketplace_tags.join(', ')
              : (ml.marketplace_tags || '')
          }
        }
      }

      return listings
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [user])

  return {
    generating,
    error,
    generateListings,
    fetchListings
  }
}
