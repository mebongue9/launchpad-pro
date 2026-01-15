// src/hooks/useCoverTemplates.js
// Hook for fetching and managing cover templates
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/TemplateSelector.jsx, src/components/cover-lab/CreativeLab.jsx

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCoverTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/.netlify/functions/cover-templates', {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      })

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new template (called from Cover Lab)
  const createTemplate = useCallback(async (templateData) => {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch('/.netlify/functions/save-cover-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify(templateData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create template')
    }

    // Refresh templates list
    await fetchTemplates()

    return data.template
  }, [fetchTemplates])

  // Delete a user template
  const deleteTemplate = useCallback(async (templateId) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    // Delete directly from Supabase (only user's own templates)
    const { error: deleteError } = await supabase
      .from('cover_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', session.user.id)
      .eq('is_default', false) // Cannot delete default templates

    if (deleteError) {
      throw new Error(deleteError.message || 'Failed to delete template')
    }

    // Refresh templates list
    await fetchTemplates()

    return true
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    deleteTemplate
  }
}

export default useCoverTemplates
