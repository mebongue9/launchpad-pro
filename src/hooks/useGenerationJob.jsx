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
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Poll for job status
  const pollJobStatus = useCallback(async (id) => {
    try {
      const response = await fetch('/.netlify/functions/check-job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: id })
      })

      if (!response.ok) {
        throw new Error('Failed to check job status')
      }

      const data = await response.json()

      setStatus(data.status)
      setProgress(data.progress || 0)
      setCurrentChunk(data.current_chunk_name)
      setTotalChunks(data.total_chunks)
      setCompletedChunks(data.completed_chunks || 0)

      // Job complete - stop polling and return result
      if (data.status === 'complete') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setResult(data.result)
        return data.result
      }

      // Job failed - stop polling and set error
      if (data.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setError(data.error_message || 'Generation failed')
        setPartialResult(data.partial_result || null)
        setCanResume(data.can_resume || false)
        return null
      }

      return null // Still processing
    } catch (err) {
      console.error('Poll error:', err)
      // Don't stop polling on network errors - might be temporary
      return null
    }
  }, [])

  // Start a new generation job
  const startJob = useCallback(async (jobType, inputData) => {
    if (!user?.id) {
      throw new Error('User must be logged in to start generation')
    }

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
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    try {
      // Start the job
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
          throw new Error(errorData.error || 'Failed to start generation')
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`)
        }
      }

      const data = await response.json()
      setJobId(data.job_id)
      setStatus('pending')

      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(data.job_id)
      }, POLL_INTERVAL)

      // Also poll immediately
      await pollJobStatus(data.job_id)

      return data.job_id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user, pollJobStatus])

  // Resume a failed job (retry from failed chunk)
  const resumeJob = useCallback(async (existingJobId) => {
    if (!existingJobId) return

    setJobId(existingJobId)
    setError(null)
    setStatus('pending')

    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(existingJobId)
    }, POLL_INTERVAL)

    // Trigger background function to resume
    try {
      await fetch('/.netlify/functions/process-generation-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: existingJobId })
      })
    } catch (err) {
      console.error('Failed to trigger resume:', err)
    }
  }, [pollJobStatus])

  // Cancel/reset the current job (client-side only)
  const cancelJob = useCallback(() => {
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
  }, [])

  // Ref to track wait intervals for cleanup
  const waitIntervalRef = useRef(null)

  // Cleanup wait interval on unmount
  useEffect(() => {
    return () => {
      if (waitIntervalRef.current) {
        clearInterval(waitIntervalRef.current)
      }
    }
  }, [])

  // Wait for job completion (returns a promise)
  const waitForCompletion = useCallback(async (id) => {
    const jobIdToWait = id || jobId
    if (!jobIdToWait) return null

    // Clear any existing wait interval
    if (waitIntervalRef.current) {
      clearInterval(waitIntervalRef.current)
    }

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          // Fetch current status from API instead of relying on stale closure
          const response = await fetch('/.netlify/functions/check-job-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobIdToWait })
          })

          if (!response.ok) {
            throw new Error('Failed to check job status')
          }

          const data = await response.json()

          if (data.status === 'complete') {
            if (waitIntervalRef.current) {
              clearInterval(waitIntervalRef.current)
              waitIntervalRef.current = null
            }
            resolve(data.result)
          } else if (data.status === 'failed') {
            if (waitIntervalRef.current) {
              clearInterval(waitIntervalRef.current)
              waitIntervalRef.current = null
            }
            reject(new Error(data.error_message || 'Generation failed'))
          }
          // If still processing, keep waiting
        } catch (err) {
          console.error('Wait check error:', err)
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
