// /src/hooks/useLeadMagnets.jsx
// Hook for lead magnet CRUD operations and AI generation
// Manages lead magnets data from Supabase
// RELEVANT FILES: src/pages/LeadMagnetBuilder.jsx, netlify/functions/generate-lead-magnet-ideas.js

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useLeadMagnets() {
  const { user } = useAuth()
  const [leadMagnets, setLeadMagnets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchLeadMagnets()
    }
  }, [user])

  async function fetchLeadMagnets() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*, profiles(name, business_name), funnels(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeadMagnets(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateIdeas(profile, audience, frontEndProduct, excludedTopics = []) {
    try {
      const response = await fetch('/.netlify/functions/generate-lead-magnet-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          audience,
          front_end_product: frontEndProduct,
          excluded_topics: excludedTopics,
          user_id: user?.id  // Pass user_id for freshness check
        })
      })

      if (!response.ok) {
        // Handle non-JSON error responses (like HTML from 504 timeout)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate ideas')
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`)
        }
      }

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  async function generateContent(leadMagnet, profile, audience, frontEndProduct) {
    try {
      const response = await fetch('/.netlify/functions/generate-lead-magnet-content-batched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_magnet: leadMagnet,
          profile,
          audience,
          front_end: frontEndProduct
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

  async function saveLeadMagnet(leadMagnetData, profileId, funnelId = null) {
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          funnel_id: funnelId,
          name: leadMagnetData.title,
          format: leadMagnetData.format || 'guide',
          topic: leadMagnetData.topic,
          keyword: leadMagnetData.keyword,
          content: leadMagnetData.sections ? leadMagnetData : null,
          caption_comment: leadMagnetData.promotion_kit?.captions?.comment_version,
          caption_dm: leadMagnetData.promotion_kit?.captions?.dm_version
        })
        .select()
        .single()

      if (error) throw error

      // Track the topic
      if (leadMagnetData.topic) {
        await supabase.from('topics_used').insert({
          user_id: user.id,
          profile_id: profileId,
          topic: leadMagnetData.topic,
          product_name: leadMagnetData.title,
          lead_magnet_id: data.id
        })
      }

      await fetchLeadMagnets()
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateLeadMagnet(id, updates) {
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchLeadMagnets()
    } catch (err) {
      throw err
    }
  }

  async function deleteLeadMagnet(id) {
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchLeadMagnets()
    } catch (err) {
      throw err
    }
  }

  async function getExcludedTopics(profileId) {
    try {
      const { data, error } = await supabase
        .from('topics_used')
        .select('topic')
        .eq('profile_id', profileId)

      if (error) throw error
      return (data || []).map(t => t.topic)
    } catch (err) {
      return []
    }
  }

  return {
    leadMagnets,
    loading,
    error,
    fetchLeadMagnets,
    generateIdeas,
    generateContent,
    saveLeadMagnet,
    updateLeadMagnet,
    deleteLeadMagnet,
    getExcludedTopics
  }
}
