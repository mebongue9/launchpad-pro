// src/hooks/useGeneratedPdfs.js
// Hook for fetching generated PDF history from styled_products table
// RELEVANT FILES: src/pages/VisualBuilder.jsx, netlify/functions/visual-builder-generate.js

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useGeneratedPdfs() {
  const { user } = useAuth()
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPdfs = useCallback(async () => {
    if (!user) {
      setPdfs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch styled_products with related data
      const { data, error: fetchError } = await supabase
        .from('styled_products')
        .select(`
          *,
          cover_templates(name, primary_color),
          funnels(name),
          lead_magnets(name, format)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform data for easier display
      const transformed = (data || []).map(item => ({
        id: item.id,
        title: item.cover_title,
        subtitle: item.cover_subtitle,
        pdfUrl: item.pdf_url,
        coverPngUrl: item.cover_png_url,
        createdAt: item.created_at,
        productType: item.product_type,
        templateName: item.cover_templates?.name || 'Unknown Template',
        templateColor: item.cover_templates?.primary_color || '#666',
        // Source info
        sourceName: item.funnels?.name || item.lead_magnets?.name || 'Unknown',
        sourceType: item.funnel_id ? 'funnel' : 'lead_magnet',
        format: item.lead_magnets?.format || null,
        // IDs for navigation
        funnelId: item.funnel_id,
        leadMagnetId: item.lead_magnet_id
      }))

      setPdfs(transformed)
    } catch (err) {
      console.error('[GENERATED-PDFS] Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Delete a generated PDF record
  const deletePdf = useCallback(async (id) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('styled_products')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      setPdfs(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      console.error('[GENERATED-PDFS] Delete error:', err)
      throw err
    }
  }, [user])

  // Initial fetch
  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  return {
    pdfs,
    loading,
    error,
    refresh: fetchPdfs,
    deletePdf
  }
}
