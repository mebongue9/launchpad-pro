// /src/hooks/useFunnels.jsx
// Hook for funnel CRUD operations and AI generation
// Manages funnels data from Supabase + document generation jobs
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, netlify/functions/generate-funnel.js

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFunnels() {
  const { user } = useAuth()
  const [funnels, setFunnels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Document generation job tracking
  const [documentJob, setDocumentJob] = useState(null) // { jobId, funnelId, status, progress, currentTask }
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchFunnels()
    }
  }, [user])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  async function fetchFunnels() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('funnels')
        .select('*, profiles(name, business_name, niche), audiences(name), existing_products(name)')
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

  // Poll for funnel idea task result
  async function pollForFunnelIdeaResult(taskId, maxAttempts = 90, intervalMs = 2000) {
    // Poll every 2 seconds for up to 3 minutes
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`/.netlify/functions/get-funnel-idea-task?task_id=${taskId}`)

      if (!response.ok) {
        throw new Error('Failed to check task status')
      }

      const data = await response.json()
      console.log(`📊 [FUNNEL-IDEA] Poll ${attempt + 1}: status=${data.status}`)

      if (data.status === 'completed') {
        console.log('✅ [FUNNEL-IDEA] Generation complete!')
        return data.result
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Funnel generation failed')
      }

      // Still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    throw new Error('Funnel generation timed out. Please try again.')
  }

  async function generateFunnel(profile, audience, existingProduct = null) {
    try {
      console.log('🚀 [FUNNEL-IDEA] Starting background generation...')

      // 1. Create task (returns immediately with task_id)
      const createResponse = await fetch('/.netlify/functions/create-funnel-idea-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          audience,
          existing_product: existingProduct,
          user_id: user?.id
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to start funnel generation')
      }

      const { task_id } = await createResponse.json()
      console.log('📋 [FUNNEL-IDEA] Task created:', task_id)

      // 2. Trigger the background function directly from frontend
      // This returns immediately due to -background suffix, but continues processing
      fetch('/.netlify/functions/process-funnel-idea-task-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id })
      }).catch(() => {}) // Fire and forget - background function returns immediately

      console.log('🔄 [FUNNEL-IDEA] Background processing triggered')

      // 3. Poll for result (background function processes it)
      const result = await pollForFunnelIdeaResult(task_id)

      return result
    } catch (err) {
      console.error('❌ [FUNNEL-IDEA] Error:', err.message)
      throw err
    }
  }

  // Poll job status
  const pollJobStatus = useCallback(async (jobId, funnelId) => {
    try {
      const response = await fetch('/.netlify/functions/check-job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      })

      if (!response.ok) {
        console.error('Job status check failed')
        return
      }

      const data = await response.json()
      console.log('📊 [JOB] Status:', data.status, 'Progress:', data.progress + '%', 'Task:', data.current_chunk_name)

      setDocumentJob({
        jobId,
        funnelId,
        status: data.status,
        progress: data.progress || 0,
        currentTask: data.status === 'failed'
          ? (data.error_message || 'Generation failed')
          : (data.current_chunk_name || 'Processing...'),
        completedChunks: data.completed_chunks || 0,
        totalChunks: data.total_chunks || 7,
        errorMessage: data.error_message
      })

      // Job complete - stop polling and refresh funnels
      if (data.status === 'complete') {
        console.log('🎉 [JOB] Document generation complete!')
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }

        // Show complete state for 3 seconds then clear
        setTimeout(() => {
          setDocumentJob(null)
          fetchFunnels() // Refresh to get the new TLDRs
        }, 3000)
      }

      // Job failed - stop polling
      if (data.status === 'failed') {
        console.error('❌ [JOB] Document generation failed:', data.error_message)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }

        // Show error for 5 seconds then clear
        setTimeout(() => {
          setDocumentJob(null)
        }, 5000)
      }

    } catch (err) {
      console.error('Poll error:', err)
    }
  }, [])

  // Start document generation job
  async function startDocumentGeneration(funnelId) {
    console.log('🚀 [DOC-GEN] Starting document generation for funnel:', funnelId)

    // Set initial state
    setDocumentJob({
      jobId: null,
      funnelId,
      status: 'starting',
      progress: 0,
      currentTask: 'Starting document generation...',
      completedChunks: 0,
      totalChunks: 7
    })

    try {
      const response = await fetch('/.netlify/functions/generate-supplementary-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: funnelId,
          user_id: user.id
        })
      })

      console.log('📥 [DOC-GEN] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [DOC-GEN] API error:', errorData)
        setDocumentJob(prev => ({
          ...prev,
          status: 'failed',
          currentTask: errorData.error || 'Failed to start generation'
        }))
        setTimeout(() => setDocumentJob(null), 5000)
        return
      }

      const result = await response.json()
      console.log('✅ [DOC-GEN] Job started:', result.job_id)

      // Update state with job ID
      setDocumentJob(prev => ({
        ...prev,
        jobId: result.job_id,
        status: 'processing',
        currentTask: 'Generating documents...'
      }))

      // Start polling for progress
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      // Poll every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(result.job_id, funnelId)
      }, 2000)

      // Also poll immediately
      pollJobStatus(result.job_id, funnelId)

    } catch (err) {
      console.error('❌ [DOC-GEN] Error:', err)
      setDocumentJob(prev => ({
        ...prev,
        status: 'failed',
        currentTask: err.message
      }))
      setTimeout(() => setDocumentJob(null), 5000)
    }
  }

  async function saveFunnel(funnelData, profileId, audienceId, existingProductId = null, language = 'English', frontEndLink = '') {
    try {
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
          front_end_link: frontEndLink,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      console.log('🚀 [SAVE] Funnel saved with ID:', data.id)

      // Refresh funnels list immediately
      await fetchFunnels()

      // NOTE: Document generation (TLDRs, cross-promos) happens LATER
      // when user selects this funnel in Lead Magnet flow and clicks "Generate"
      // This is intentional - we don't consume tokens until user explicitly triggers generation

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
    generateProductContent,
    // Document generation job tracking
    documentJob,
    startDocumentGeneration
  }
}
