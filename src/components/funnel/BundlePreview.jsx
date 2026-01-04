// /src/components/funnel/BundlePreview.jsx
// Displays bundle listing with pricing, descriptions, and tags
// Shows savings and total value prominently
// RELEVANT FILES: src/hooks/useBundles.js, netlify/functions/generate-bundle-listings.js

import { useState, useEffect } from 'react'
import { useBundles } from '../../hooks/useBundles'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import {
  Package,
  RefreshCw,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Tag,
  DollarSign,
  TrendingDown
} from 'lucide-react'

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
    >
      {copied ? (
        <><Check className="w-3 h-3" /> Copied</>
      ) : (
        <><Copy className="w-3 h-3" /> {label}</>
      )}
    </button>
  )
}

export default function BundlePreview({ funnel, language = 'English', onRefresh }) {
  const { bundle, loading, generating, error, fetchBundle, generateBundle } = useBundles()

  useEffect(() => {
    if (funnel?.id) {
      fetchBundle(funnel.id)
    }
  }, [funnel?.id, fetchBundle])

  const handleGenerate = async () => {
    try {
      await generateBundle(funnel.id, language)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Failed to generate bundle:', err)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading bundle...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Bundle Listing
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            All 4 products at ~45% of total value
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant={bundle ? 'secondary' : 'primary'}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : bundle ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Bundle
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!bundle && !generating ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No bundle listing yet. Click "Generate Bundle" to create one.
          </p>
        </div>
      ) : bundle && (
        <div className="space-y-6">
          {/* Pricing Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Total Value</span>
              </div>
              <p className="text-xl font-bold text-gray-400 line-through">
                ${bundle.total_individual_price}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs">Bundle Price</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${bundle.bundle_price}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs">Savings</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                ${bundle.savings}
              </p>
            </div>
          </div>

          {/* Bundle Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Bundle Title
                <span className="text-xs text-gray-400 ml-2">
                  ({bundle.title?.length || 0}/140 chars)
                </span>
              </span>
              <CopyButton text={bundle.title} label="Copy" />
            </div>
            <p className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
              {bundle.title}
            </p>
          </div>

          {/* Etsy Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Etsy Description
              </span>
              <CopyButton text={bundle.etsy_description} label="Copy" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
              {bundle.etsy_description}
            </div>
          </div>

          {/* Gumroad Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Gumroad Description
              </span>
              <CopyButton text={bundle.normal_description} label="Copy" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              {bundle.normal_description}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                SEO Tags
              </span>
              <CopyButton text={bundle.tags} label="Copy All" />
            </div>
            <div className="flex flex-wrap gap-2">
              {bundle.tags?.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
