// /src/hooks/useEtsyEmpire.js
// Hook for Etsy Empire project management
// Handles project CRUD, polling, and downloads
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, netlify/functions/create-etsy-empire-project.js

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useEtsyEmpire() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentProject, setCurrentProject] = useState(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchProjects()
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

  // Fetch all user's projects
  const fetchProjects = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('etsy_empire_projects')
        .select(`
          *,
          funnels(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProjects(data || [])
    } catch (err) {
      console.error('[useEtsyEmpire] fetchProjects error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get a single project with assets and spintax
  const getProject = useCallback(async (projectId) => {
    try {
      const response = await fetch(`/.netlify/functions/get-etsy-empire-project?project_id=${projectId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch project')
      }

      const data = await response.json()
      setCurrentProject(data)
      return data
    } catch (err) {
      console.error('[useEtsyEmpire] getProject error:', err)
      throw err
    }
  }, [])

  // Create a new project
  const createProject = useCallback(async (projectData) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('[useEtsyEmpire] Creating project:', projectData.product_title)

      const response = await fetch('/.netlify/functions/create-etsy-empire-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          user_id: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create project')
      }

      const data = await response.json()
      console.log('[useEtsyEmpire] Project created:', data.project_id)

      // Refresh projects list
      await fetchProjects()

      return data
    } catch (err) {
      console.error('[useEtsyEmpire] createProject error:', err)
      throw err
    }
  }, [user, fetchProjects])

  // Poll for project result
  const pollForResult = useCallback(async (projectId, onUpdate, maxAttempts = 300, intervalMs = 2000) => {
    // Poll every 2 seconds for up to 10 minutes
    console.log(`[useEtsyEmpire] Starting poll for project: ${projectId}`)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/.netlify/functions/get-etsy-empire-project?project_id=${projectId}`)

        if (!response.ok) {
          throw new Error('Failed to check project status')
        }

        const data = await response.json()
        console.log(`[useEtsyEmpire] Poll ${attempt + 1}: status=${data.status} (${data.completed_tasks}/${data.total_tasks})`)

        // Call onUpdate callback with current status
        if (onUpdate) {
          onUpdate(data)
        }

        if (data.status === 'completed') {
          console.log('[useEtsyEmpire] Generation complete!')
          // Don't await fetchProjects during poll callback - let it run in background
          // The onUpdate callback already has the complete data with assets
          fetchProjects().catch(err => console.error('[useEtsyEmpire] Background refresh error:', err))
          return data
        }

        if (data.status === 'failed') {
          throw new Error(data.error || 'Generation failed')
        }

        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      } catch (err) {
        console.error('[useEtsyEmpire] Poll error:', err)
        throw err
      }
    }

    throw new Error('Generation timed out. Please check the project status manually.')
  }, [fetchProjects])

  // Delete a project
  const deleteProject = useCallback(async (projectId) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error: deleteError } = await supabase
        .from('etsy_empire_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Refresh projects list
      await fetchProjects()
    } catch (err) {
      console.error('[useEtsyEmpire] deleteProject error:', err)
      throw err
    }
  }, [user, fetchProjects])

  // Upload PDF to Supabase storage
  const uploadPdf = useCallback(async (file) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/etsy-empire/uploads/${fileName}`

      console.log('[useEtsyEmpire] Uploading PDF:', filePath)

      const { data, error: uploadError } = await supabase.storage
        .from('visual-designs')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('visual-designs')
        .getPublicUrl(filePath)

      console.log('[useEtsyEmpire] PDF uploaded:', publicUrl)
      return publicUrl
    } catch (err) {
      console.error('[useEtsyEmpire] uploadPdf error:', err)
      throw err
    }
  }, [user])

  // Get download URL for assets (placeholder - real implementation in Phase 4)
  const getDownloadUrl = useCallback(async (projectId, type = 'all') => {
    // For now, return a placeholder
    // In Phase 4, this will generate a ZIP file
    console.log(`[useEtsyEmpire] getDownloadUrl called for project ${projectId}, type: ${type}`)
    return null
  }, [])

  return {
    projects,
    loading,
    error,
    currentProject,
    fetchProjects,
    getProject,
    createProject,
    pollForResult,
    deleteProject,
    uploadPdf,
    getDownloadUrl
  }
}
