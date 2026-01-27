// /src/components/etsy-empire/DownloadPanel.jsx
// Download buttons for ZIP files and Copy Spintax JSON
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, src/hooks/useEtsyEmpire.js

import { useState } from 'react'
import { Download, Copy, Check, ShoppingBag, Pin, Package, DollarSign } from 'lucide-react'

export function DownloadPanel({ project, assets = [], spintax = null }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(null) // 'all' | 'etsy' | 'pinterest'

  const etsyAssets = assets.filter(a => a.asset_type === 'etsy_slide')
  const pinterestAssets = assets.filter(a => a.asset_type === 'pinterest_pin')

  const handleCopySpintax = async () => {
    if (!spintax?.full_payload) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(spintax.full_payload, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = async (type) => {
    // For now, this is a placeholder
    // In Phase 4, this will generate and download a ZIP file
    setDownloading(type)

    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, just show alert that this will be implemented
    alert(`ZIP download for "${type}" will be implemented in Phase 4`)

    setDownloading(null)
  }

  return (
    <div className="space-y-4">
      {/* Cost summary */}
      {project?.actual_cost && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            Total cost: ${project.actual_cost.toFixed(2)}
          </span>
        </div>
      )}

      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Download All */}
        <button
          onClick={() => handleDownload('all')}
          disabled={downloading || assets.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloading === 'all' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              Download All ({assets.length})
            </>
          )}
        </button>

        {/* Download Etsy Only */}
        <button
          onClick={() => handleDownload('etsy')}
          disabled={downloading || etsyAssets.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloading === 'etsy' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Etsy Only ({etsyAssets.length})
            </>
          )}
        </button>

        {/* Download Pinterest Only */}
        {project?.pinterest_enabled && (
          <button
            onClick={() => handleDownload('pinterest')}
            disabled={downloading || pinterestAssets.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === 'pinterest' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Pin className="w-4 h-4" />
                Pinterest Only ({pinterestAssets.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Spintax section */}
      {spintax && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Spintax Data</h4>
            <button
              onClick={handleCopySpintax}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </>
              )}
            </button>
          </div>

          {/* Spintax preview */}
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(spintax.full_payload, null, 2).slice(0, 500)}
              {JSON.stringify(spintax.full_payload, null, 2).length > 500 && '...'}
            </pre>
          </div>

          {spintax.master_description && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Master Description</p>
              <p className="text-sm text-gray-700">{spintax.master_description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
