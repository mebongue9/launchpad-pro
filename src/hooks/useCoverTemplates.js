// src/hooks/useCoverTemplates.js
// Hook for fetching and managing cover templates
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/TemplateSelector.jsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCoverTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchTemplates() {
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
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  }
}

export default useCoverTemplates
