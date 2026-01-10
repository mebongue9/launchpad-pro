// /src/hooks/useGenerationJob.jsx
// Hook for managing background AI content generation jobs
// Handles job creation, polling, progress tracking, and error recovery
// RELEVANT FILES: start-generation.js, check-job-status.js, process-generation-background.js

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'

// Polling interval in milliseconds
const POLL_INTERVAL = 3000

export function useGenerationJob() {
  const { user } = useAuth()
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null) // 'pending' | 'processing' | 'complete' | 'failed'
  const [progress, setProgress] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(null)
  const [totalChunks, setTotalChunks] = useState(null)
  const [completedChunks, setCompletedChunks] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [partialResult, setPartialResult] = useState(null)
  const [canResume, setCanResume] = useState(false)

  // Use ref to track polling interval
  const pollIntervalRef = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    console.log('🚀 [GENERATION-JOB] Hook initialized')
    return () => {
      if (pollIntervalRef.current) {
        console.log('🔄 [GENERATION-JOB] Cleanup - clearing poll interval')
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Poll for job status
  const pollJobStatus = useCallback(async (id) => {
    console.log('🔄 [GENERATION-JOB] Polling status for job:', id)
    try {
      const response = await fetch('/.netlify/functions/check-job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: id })
      })

      if (!response.ok) {
        console.error('❌ [GENERATION-JOB] Poll response not OK:', response.status)
        throw new Error('Failed to check job status')
      }

      const data = await response.json()
      console.log('📥 [GENERATION-JOB] Poll response:', {
        status: data.status,
        progress: data.progress,
        currentChunk: data.current_chunk_name,
        completedChunks: data.completed_chunks,
        totalChunks: data.total_chunks
      })

      setStatus(data.status)
      setProgress(data.progress || 0)
      setCurrentChunk(data.current_chunk_name)
      setTotalChunks(data.total_chunks)
      setCompletedChunks(data.completed_chunks || 0)

      // Job complete - stop polling and return result
      if (data.status === 'complete') {
        console.log('✅ [GENERATION-JOB] Job complete! Stopping poll interval')
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setResult(data.result)
        console.log('✅ [GENERATION-JOB] Result received, keys:', Object.keys(data.result || {}))
        return data.result
      }

      // Job failed - stop polling and set error
      if (data.status === 'failed') {
        console.error('❌ [GENERATION-JOB] Job failed:', data.error_message)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setError(data.error_message || 'Generation failed')
        setPartialResult(data.partial_result || null)
        setCanResume(data.can_resume || false)
        console.log('❌ [GENERATION-JOB] Can resume:', data.can_resume, 'Partial result available:', !!data.partial_result)
        return null
      }

      return null // Still processing
    } catch (err) {
      console.error('❌ [GENERATION-JOB] Poll error:', err.message)
      // Don't stop polling on network errors - might be temporary
      return null
    }
  }, [])

  // Start a new generation job
  const startJob = useCallback(async (jobType, inputData) => {
    if (!user?.id) {
      console.error('❌ [GENERATION-JOB] Cannot start job - no user authenticated')
      throw new Error('User must be logged in to start generation')
    }

    console.log('🚀 [GENERATION-JOB] Starting new job:', jobType)
    console.log('📥 [GENERATION-JOB] Input data keys:', Object.keys(inputData))

    // Reset state
    setJobId(null)
    setStatus(null)
    setProgress(0)
    setCurrentChunk(null)
    setTotalChunks(null)
    setCompletedChunks(0)
    setResult(null)
    setError(null)
    setPartialResult(null)
    setCanResume(false)

    // Clear any existing polling
    if (pollIntervalRef.current) {
      console.log('🔄 [GENERATION-JOB] Clearing existing poll interval')
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    try {
      // Start the job
      console.log('📥 [GENERATION-JOB] Calling /.netlify/functions/start-generation')
      const response = await fetch('/.netlify/functions/start-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: jobType,
          input_data: inputData,
          user_id: user.id
        })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          console.error('❌ [GENERATION-JOB] Start job error response:', errorData)
          throw new Error(errorData.error || 'Failed to start generation')
        } else {
          console.error('❌ [GENERATION-JOB] Start job server error:', response.status)
          throw new Error(`Server error (${response.status}). Please try again.`)
        }
      }

      const data = await response.json()
      console.log('✅ [GENERATION-JOB] Job started successfully, job_id:', data.job_id)
      setJobId(data.job_id)
      setStatus('pending')

      // Start polling
      console.log('🔄 [GENERATION-JOB] Starting poll interval, every', POLL_INTERVAL, 'ms')
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(data.job_id)
      }, POLL_INTERVAL)

      // Also poll immediately
      console.log('🔄 [GENERATION-JOB] Triggering immediate poll')
      await pollJobStatus(data.job_id)

      return data.job_id
    } catch (err) {
      console.error('❌ [GENERATION-JOB] Start job exception:', err.message)
      setError(err.message)
      throw err
    }
  }, [user, pollJobStatus])

  // Resume a failed job (retry from failed chunk)
  const resumeJob = useCallback(async (existingJobId) => {
    if (!existingJobId) {
      console.log('🔄 [GENERATION-JOB] Resume called with no job ID')
      return
    }

    console.log('🔄 [GENERATION-JOB] Resuming job:', existingJobId)
    setJobId(existingJobId)
    setError(null)
    setStatus('pending')

    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Start polling
    console.log('🔄 [GENERATION-JOB] Starting poll interval for resumed job')
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(existingJobId)
    }, POLL_INTERVAL)

    // Trigger background function to resume
    try {
      console.log('📥 [GENERATION-JOB] Calling /.netlify/functions/process-generation-background to resume')
      await fetch('/.netlify/functions/process-generation-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: existingJobId })
      })
      console.log('✅ [GENERATION-JOB] Resume trigger sent')
    } catch (err) {
      console.error('❌ [GENERATION-JOB] Failed to trigger resume:', err.message)
    }
  }, [pollJobStatus])

  // Cancel/reset the current job (client-side only)
  const cancelJob = useCallback(() => {
    console.log('🔄 [GENERATION-JOB] Cancelling job:', jobId)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setJobId(null)
    setStatus(null)
    setProgress(0)
    setCurrentChunk(null)
    setTotalChunks(null)
    setCompletedChunks(0)
    setResult(null)
    setError(null)
    setPartialResult(null)
    setCanResume(false)
    console.log('✅ [GENERATION-JOB] Job cancelled and state reset')
  }, [jobId])

  // Ref to track wait intervals for cleanup
  const waitIntervalRef = useRef(null)

  // Cleanup wait interval on unmount
  useEffect(() => {
    return () => {
      if (waitIntervalRef.current) {
        console.log('🔄 [GENERATION-JOB] Cleanup - clearing wait interval')
        clearInterval(waitIntervalRef.current)
      }
    }
  }, [])

  // Wait for job completion (returns a promise)
  const waitForCompletion = useCallback(async (id) => {
    const jobIdToWait = id || jobId
    if (!jobIdToWait) {
      console.log('🔄 [GENERATION-JOB] waitForCompletion called with no job ID')
      return null
    }

    console.log('🔄 [GENERATION-JOB] Waiting for completion of job:', jobIdToWait)

    // Clear any existing wait interval
    if (waitIntervalRef.current) {
      clearInterval(waitIntervalRef.current)
    }

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          console.log('🔄 [GENERATION-JOB] Wait check - polling status')
          // Fetch current status from API instead of relying on stale closure
          const response = await fetch('/.netlify/functions/check-job-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobIdToWait })
          })

          if (!response.ok) {
            console.error('❌ [GENERATION-JOB] Wait check - response not OK:', response.status)
            throw new Error('Failed to check job status')
          }

          const data = await response.json()
          console.log('📥 [GENERATION-JOB] Wait check - status:', data.status, 'progress:', data.progress)

          if (data.status === 'complete') {
            console.log('✅ [GENERATION-JOB] Wait complete - job finished successfully')
            if (waitIntervalRef.current) {
              clearInterval(waitIntervalRef.current)
              waitIntervalRef.current = null
            }
            resolve(data.result)
          } else if (data.status === 'failed') {
            console.error('❌ [GENERATION-JOB] Wait complete - job failed:', data.error_message)
            if (waitIntervalRef.current) {
              clearInterval(waitIntervalRef.current)
              waitIntervalRef.current = null
            }
            reject(new Error(data.error_message || 'Generation failed'))
          }
          // If still processing, keep waiting
        } catch (err) {
          console.error('❌ [GENERATION-JOB] Wait check error:', err.message)
          // Don't reject on network errors - might be temporary
        }
      }

      // Initial check
      checkStatus()

      // Set up interval for subsequent checks (store ref for cleanup)
      waitIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL)
    })
  }, [jobId])

  // Check if job is active (pending or processing)
  const isActive = status === 'pending' || status === 'processing'

  return {
    // Job state
    jobId,
    status,
    progress,
    currentChunk,
    totalChunks,
    completedChunks,
    result,
    error,
    partialResult,
    canResume,
    isActive,

    // Actions
    startJob,
    resumeJob,
    cancelJob,
    waitForCompletion
  }
}

// Helper hook for specific job types
export function useLeadMagnetContentJob() {
  const job = useGenerationJob()

  const generateContent = useCallback(async (leadMagnet, profile, audience, frontEndProduct, language = 'English') => {
    console.log('🚀 [LEAD-MAGNET-CONTENT] Starting content generation')
    console.log('📥 [LEAD-MAGNET-CONTENT] Lead magnet:', leadMagnet?.title || leadMagnet?.type)
    console.log('📥 [LEAD-MAGNET-CONTENT] Profile:', profile?.name || profile?.business_name)
    console.log('📥 [LEAD-MAGNET-CONTENT] Language:', language)
    return job.startJob('lead_magnet_content', {
      lead_magnet: leadMagnet,
      profile,
      audience,
      front_end_product: frontEndProduct,
      language
    })
  }, [job.startJob])

  return { ...job, generateContent }
}

export function useLeadMagnetIdeasJob() {
  const job = useGenerationJob()

  const generateIdeas = useCallback(async (profile, audience, frontEndProduct, excludedTopics = [], language = 'English') => {
    console.log('🚀 [LEAD-MAGNET-IDEAS] Starting ideas generation')
    console.log('📥 [LEAD-MAGNET-IDEAS] Profile:', profile?.name || profile?.business_name)
    console.log('📥 [LEAD-MAGNET-IDEAS] Excluded topics count:', excludedTopics.length)
    console.log('📥 [LEAD-MAGNET-IDEAS] Language:', language)
    return job.startJob('lead_magnet_ideas', {
      profile,
      audience,
      front_end_product: frontEndProduct,
      excluded_topics: excludedTopics,
      language
    })
  }, [job.startJob])

  return { ...job, generateIdeas }
}

export function useFunnelJob() {
  const job = useGenerationJob()

  const generateFunnel = useCallback(async (profile, audience, existingProduct = null, language = 'English') => {
    console.log('🚀 [FUNNEL] Starting funnel generation')
    console.log('📥 [FUNNEL] Profile:', profile?.name || profile?.business_name)
    console.log('📥 [FUNNEL] Audience:', audience?.name)
    console.log('📥 [FUNNEL] Existing product:', existingProduct?.name || 'none')
    console.log('📥 [FUNNEL] Language:', language)
    return job.startJob('funnel', {
      profile,
      audience,
      existing_product: existingProduct,
      language
    })
  }, [job.startJob])

  return { ...job, generateFunnel }
}

export function useFunnelProductJob() {
  const job = useGenerationJob()

  const generateProductContent = useCallback(async (product, profile, audience, nextProduct = null, language = 'English') => {
    console.log('🚀 [FUNNEL-PRODUCT] Starting product content generation')
    console.log('📥 [FUNNEL-PRODUCT] Product:', product?.name)
    console.log('📥 [FUNNEL-PRODUCT] Profile:', profile?.name || profile?.business_name)
    console.log('📥 [FUNNEL-PRODUCT] Next product:', nextProduct?.name || 'none')
    console.log('📥 [FUNNEL-PRODUCT] Language:', language)
    return job.startJob('funnel_product', {
      product,
      profile,
      audience,
      next_product: nextProduct,
      language
    })
  }, [job.startJob])

  return { ...job, generateProductContent }
}

export function useFunnelRemainingContentJob() {
  const job = useGenerationJob()

  const generateRemainingContent = useCallback(async (funnelId) => {
    console.log('🚀 [FUNNEL-REMAINING] Starting remaining funnel content generation')
    console.log('📥 [FUNNEL-REMAINING] Funnel ID:', funnelId)
    return job.startJob('funnel_remaining_content', {
      funnel_id: funnelId
    })
  }, [job.startJob])

  return { ...job, generateRemainingContent }
}
