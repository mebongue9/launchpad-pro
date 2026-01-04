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

  // Fetch marketplace data from funnel
  const fetchListings = useCallback(async (funnelId) => {
    if (!user || !funnelId) return null

    try {
      const { data, error: fetchError } = await supabase
        .from('funnels')
        .select(`
          front_end_marketplace_title,
          front_end_etsy_description,
          front_end_normal_description,
          front_end_marketplace_tags,
          bump_marketplace_title,
          bump_etsy_description,
          bump_normal_description,
          bump_marketplace_tags,
          upsell_1_marketplace_title,
          upsell_1_etsy_description,
          upsell_1_normal_description,
          upsell_1_marketplace_tags,
          upsell_2_marketplace_title,
          upsell_2_etsy_description,
          upsell_2_normal_description,
          upsell_2_marketplace_tags
        `)
        .eq('id', funnelId)
        .single()

      if (fetchError) throw fetchError

      // Restructure into object by product level
      const listings = {}
      const levels = ['front_end', 'bump', 'upsell_1', 'upsell_2']

      for (const level of levels) {
        if (data[`${level}_marketplace_title`]) {
          listings[level] = {
            marketplace_title: data[`${level}_marketplace_title`],
            etsy_description: data[`${level}_etsy_description`],
            normal_description: data[`${level}_normal_description`],
            marketplace_tags: data[`${level}_marketplace_tags`]
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
