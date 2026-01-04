// /src/pages/History.jsx
// Creation history and management page
// Shows all generated funnels, lead magnets, and visuals
// RELEVANT FILES: src/hooks/useCreations.jsx, src/hooks/useFunnels.jsx, src/hooks/useLeadMagnets.jsx

import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useCreations } from '../hooks/useCreations'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useToast } from '../components/ui/Toast'
import {
  History as HistoryIcon,
  FileText,
  Palette,
  Magnet,
  Rocket,
  Download,
  Trash2,
  Eye,
  Calendar,
  Filter,
  X,
  Loader2
} from 'lucide-react'

export default function History() {
  const { creations, loading: creationsLoading, deleteCreation } = useCreations()
  const { funnels, loading: funnelsLoading } = useFunnels()
  const { leadMagnets, loading: leadMagnetsLoading } = useLeadMagnets()
  const { addToast } = useToast()

  const [filter, setFilter] = useState('all')
  const [previewHTML, setPreviewHTML] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const loading = creationsLoading || funnelsLoading || leadMagnetsLoading

  // Combine all items into a timeline
  const allItems = [
    ...creations.map(c => ({
      id: c.id,
      type: 'creation',
      subtype: c.type,
      name: c.name,
      date: new Date(c.created_at),
      data: c
    })),
    ...funnels.map(f => ({
      id: f.id,
      type: 'funnel',
      name: f.name,
      date: new Date(f.created_at),
      data: f
    })),
    ...leadMagnets.map(lm => ({
      id: lm.id,
      type: 'leadmagnet',
      name: lm.name,
      date: new Date(lm.created_at),
      data: lm
    }))
  ].sort((a, b) => b.date - a.date)

  const filteredItems = filter === 'all'
    ? allItems
    : allItems.filter(item => item.type === filter)

  function getIcon(type) {
    switch (type) {
      case 'creation': return Palette
      case 'funnel': return Rocket
      case 'leadmagnet': return Magnet
      default: return FileText
    }
  }

  function getTypeLabel(item) {
    if (item.type === 'creation') {
      return item.subtype === 'funnel_visual' ? 'Funnel Design' : 'Lead Magnet Design'
    }
    if (item.type === 'funnel') return 'Product Funnel'
    if (item.type === 'leadmagnet') return 'Lead Magnet'
    return 'Item'
  }

  function getTypeColor(type) {
    switch (type) {
      case 'creation': return 'bg-purple-100 text-purple-700'
      case 'funnel': return 'bg-blue-100 text-blue-700'
      case 'leadmagnet': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    if (item.type !== 'creation') {
      addToast('Only visual creations can be deleted from history', 'error')
      return
    }

    setDeleting(item.id)
    try {
      await deleteCreation(item.id)
      addToast('Deleted successfully', 'success')
    } catch (error) {
      addToast('Failed to delete', 'error')
    } finally {
      setDeleting(null)
    }
  }

  function handlePreview(item) {
    if (item.type === 'creation' && item.data.html_content) {
      setPreviewHTML(item.data.html_content)
    } else {
      addToast('No preview available for this item', 'info')
    }
  }

  function handleDownload(item) {
    if (item.type === 'creation' && item.data.html_content) {
      const blob = new Blob([item.data.html_content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.name}.html`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Downloaded!', 'success')
    } else {
      addToast('Download not available for this item', 'info')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-gray-500 mt-1">View and manage your creations</p>
        </div>
        <Card className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-gray-500 mt-2">Loading history...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-gray-500 mt-1">
            View and manage your creations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="creation">Visual Designs</option>
            <option value="funnel">Funnels</option>
            <option value="leadmagnet">Lead Magnets</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Items Yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {filter === 'all'
              ? 'Create funnels, lead magnets, or visual designs to see them here.'
              : `No ${filter === 'creation' ? 'visual designs' : filter === 'funnel' ? 'funnels' : 'lead magnets'} yet.`
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const Icon = getIcon(item.type)
            return (
              <Card key={`${item.type}-${item.id}`} className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'creation' && item.data.html_content && (
                      <>
                        <button
                          onClick={() => handlePreview(item)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {item.type === 'creation' && (
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deleting === item.id}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewHTML && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Preview</h3>
              <button
                onClick={() => setPreviewHTML(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={previewHTML}
                title="Preview"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
