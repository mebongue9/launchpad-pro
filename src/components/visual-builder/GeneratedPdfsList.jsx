// src/components/visual-builder/GeneratedPdfsList.jsx
// Displays history of generated PDFs with metadata
// RELEVANT FILES: src/hooks/useGeneratedPdfs.js, src/pages/VisualBuilder.jsx

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useGeneratedPdfs } from '../../hooks/useGeneratedPdfs'
import { useToast } from '../ui/Toast'
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Calendar,
  Tag,
  Palette,
  FolderOpen
} from 'lucide-react'

// Format product type for display
function formatProductType(type) {
  const labels = {
    'lead_magnet': 'Lead Magnet',
    'front_end': 'Front-End',
    'bump': 'Bump',
    'upsell_1': 'Upsell 1',
    'upsell_2': 'Upsell 2'
  }
  return labels[type] || type
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

// Format file size for display
function formatFormat(format) {
  const labels = {
    'checklist': 'Checklist',
    'worksheet': 'Worksheet',
    'planner': 'Planner',
    'swipe-file': 'Swipe File',
    'blueprint': 'Blueprint',
    'cheat-sheet': 'Cheat Sheet'
  }
  return labels[format] || format
}

export function GeneratedPdfsList() {
  const { pdfs, loading, error, refresh, deletePdf } = useGeneratedPdfs()
  const { addToast } = useToast()
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (pdf) => {
    if (!confirm(`Delete "${pdf.title}"? This cannot be undone.`)) return

    try {
      setDeleting(pdf.id)
      await deletePdf(pdf.id)
      addToast('PDF deleted', 'success')
    } catch (err) {
      addToast('Failed to delete PDF', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (pdf) => {
    if (!pdf.pdfUrl) {
      addToast('PDF URL not available', 'error')
      return
    }
    window.open(pdf.pdfUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load PDFs: {error}</p>
        <Button onClick={refresh} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </Card>
    )
  }

  if (pdfs.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Generated PDFs Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          PDFs you generate will appear here. Go to PDF Generator to create your first styled PDF.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pdfs.length} generated PDF{pdfs.length !== 1 ? 's' : ''}
        </p>
        <Button variant="secondary" size="sm" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* PDF Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map(pdf => (
          <Card key={pdf.id} className="p-4 hover:shadow-md transition-shadow">
            {/* Header with color accent */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pdf.templateColor }}
                />
                <span className="text-xs text-gray-500">{pdf.templateName}</span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(pdf.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {pdf.title}
            </h3>

            {/* Subtitle if exists */}
            {pdf.subtitle && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                {pdf.subtitle}
              </p>
            )}

            {/* Metadata tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Source type badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                pdf.sourceType === 'funnel'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {pdf.sourceType === 'funnel' ? 'Funnel' : 'Lead Magnet'}
              </span>

              {/* Product type badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {formatProductType(pdf.productType)}
              </span>

              {/* Format badge if lead magnet */}
              {pdf.format && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {formatFormat(pdf.format)}
                </span>
              )}
            </div>

            {/* Source name */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <FileText className="w-3 h-3" />
              <span className="truncate">From: {pdf.sourceName}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleDownload(pdf)}
                disabled={!pdf.pdfUrl}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDelete(pdf)}
                disabled={deleting === pdf.id}
              >
                {deleting === pdf.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
