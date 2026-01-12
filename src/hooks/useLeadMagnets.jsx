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

  // FIX: Prevent duplicate lead magnets - check if exists for funnel, update instead of insert
  // Also link lead_magnet_id to funnel to prevent backend from creating another
  async function saveLeadMagnet(leadMagnetData, profileId, funnelId = null) {
    try {
      // Check if lead_magnet already exists for this funnel to prevent duplicates
      let existingLeadMagnet = null
      if (funnelId) {
        const { data: existing } = await supabase
          .from('lead_magnets')
          .select('id')
          .eq('funnel_id', funnelId)
          .eq('user_id', user.id)
          .single()
        existingLeadMagnet = existing
      }

      let data
      if (existingLeadMagnet) {
        // Update existing lead magnet instead of creating duplicate
        const { data: updated, error } = await supabase
          .from('lead_magnets')
          .update({
            profile_id: profileId,
            name: leadMagnetData.title,
            format: leadMagnetData.format || 'guide',
            topic: leadMagnetData.topic,
            keyword: leadMagnetData.keyword,
            // CONTENT STRUCTURE (lead_magnets.content JSONB):
            // {
            //   cover: { type: "cover", title, author, tagline, subtitle },
            //   chapters: [{ type: "chapter", number, title, content }, ...]
            // }
            // NOTE: Generator may use "chapters" or "sections" - handle both
            content: (leadMagnetData.sections || leadMagnetData.chapters) ? leadMagnetData : null,
            caption_comment: leadMagnetData.promotion_kit?.captions?.comment_version,
            caption_dm: leadMagnetData.promotion_kit?.captions?.dm_version,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLeadMagnet.id)
          .select()
          .single()
        if (error) throw error
        data = updated
        console.log('📝 [LEAD-MAGNETS] Updated existing lead magnet:', data.id)
      } else {
        // Insert new lead magnet
        const { data: inserted, error } = await supabase
          .from('lead_magnets')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            funnel_id: funnelId,
            name: leadMagnetData.title,
            format: leadMagnetData.format || 'guide',
            topic: leadMagnetData.topic,
            keyword: leadMagnetData.keyword,
            // CONTENT STRUCTURE: { cover: {...}, chapters: [...] }
            content: (leadMagnetData.sections || leadMagnetData.chapters) ? leadMagnetData : null,
            caption_comment: leadMagnetData.promotion_kit?.captions?.comment_version,
            caption_dm: leadMagnetData.promotion_kit?.captions?.dm_version
          })
          .select()
          .single()
        if (error) throw error
        data = inserted
        console.log('📝 [LEAD-MAGNETS] Created new lead magnet:', data.id)
      }

      // CRITICAL FIX: Link lead_magnet_id to funnel (prevents backend from creating another)
      if (funnelId && data?.id) {
        await supabase
          .from('funnels')
          .update({ lead_magnet_id: data.id })
          .eq('id', funnelId)
        console.log('🔗 [LEAD-MAGNETS] Linked lead_magnet to funnel:', funnelId)
      }

      // Track the topic (only for new lead magnets)
      if (!existingLeadMagnet && leadMagnetData.topic) {
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
