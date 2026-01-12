// /src/components/funnel/MarketplaceListings.jsx
// Displays marketplace listings (Etsy/Gumroad) for funnel products
// Shows title, descriptions, and tags with copy functionality
// RELEVANT FILES: src/hooks/useMarketplaceListings.js, netlify/functions/generate-marketplace-listings.js

import { useState, useEffect } from 'react'
import { useMarketplaceListings } from '../../hooks/useMarketplaceListings'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import {
  Store,
  RefreshCw,
  Loader2,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  FileText
} from 'lucide-react'

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
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

function ProductListing({ level, listing, productName, expanded, onToggle }) {
  const levelLabels = {
    front_end: 'Front-End',
    bump: 'Bump',
    upsell_1: 'Upsell 1',
    upsell_2: 'Upsell 2'
  }

  const levelColors = {
    front_end: 'bg-blue-100 text-blue-600',
    bump: 'bg-green-100 text-green-600',
    upsell_1: 'bg-orange-100 text-orange-600',
    upsell_2: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="
          w-full flex items-center justify-between
          p-4 bg-gray-50 hover:bg-gray-100
          transition-colors text-left
        "
      >
        <div className="flex items-center gap-3">
          <span className={`
            px-2 py-1 rounded text-xs font-medium
            ${levelColors[level]}
          `}>
            {levelLabels[level]}
          </span>
          <div>
            <p className="font-medium text-gray-900">{productName}</p>
            <p className="text-sm text-gray-500 truncate max-w-md">
              {listing.marketplace_title}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-200 space-y-6">
          {/* Copy Full Listing Button - copies title + description for Etsy/Gumroad */}
          <div className="flex justify-end">
            <CopyButton
              text={`${listing.marketplace_title || ''}\n\n${listing.marketplace_description || ''}`}
              label="Copy Full Listing (Title + Description)"
            />
          </div>

          {/* Marketplace Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Marketplace Title
                <span className="text-xs text-gray-400">
                  ({listing.marketplace_title?.length || 0}/140 chars)
                </span>
              </span>
              <CopyButton text={listing.marketplace_title || ''} label="Copy" />
            </div>
            <p className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
              {listing.marketplace_title || 'No title generated'}
            </p>
          </div>

          {/* Etsy/Gumroad Description - formatted for readability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Etsy/Gumroad Description
                <span className="text-xs text-gray-400 ml-2">
                  ({listing.marketplace_description?.length || 0} chars)
                </span>
              </span>
              <CopyButton text={listing.marketplace_description || ''} label="Copy" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm max-h-80 overflow-y-auto">
              {listing.marketplace_description ? (
                <div className="space-y-3">
                  {listing.marketplace_description.split(/\n\n+/).map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              ) : (
                'No description generated'
              )}
            </div>
          </div>

          {/* What's Included */}
          {listing.marketplace_bullets && listing.marketplace_bullets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  What's Included
                </span>
                <CopyButton
                  text={listing.marketplace_bullets.map(b => `• ${b}`).join('\n')}
                  label="Copy All"
                />
              </div>
              <ul className="space-y-2 p-3 bg-gray-50 rounded-lg">
                {listing.marketplace_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                SEO Tags (13)
              </span>
              <CopyButton text={listing.marketplace_tags || ''} label="Copy All" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(listing.marketplace_tags || '').split(',').filter(tag => tag.trim()).map((tag, index) => (
                <span
                  key={index}
                  className="
                    px-2 py-1 bg-blue-50 text-blue-700
                    rounded text-sm
                  "
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MarketplaceListings({ funnel, language = 'English', onRefresh }) {
  const { generating, error, generateListings, fetchListings } = useMarketplaceListings()
  const [listings, setListings] = useState({})
  const [expandedProduct, setExpandedProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (funnel?.id) {
      loadListings()
    }
  }, [funnel?.id])

  const loadListings = async () => {
    setLoading(true)
    const data = await fetchListings(funnel.id)
    setListings(data || {})
    setLoading(false)
  }

  const handleGenerate = async () => {
    try {
      const result = await generateListings(funnel.id, null, language)
      setListings(result || {})
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Failed to generate listings:', err)
    }
  }

  const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2']
  const hasListings = Object.keys(listings).length > 0

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading marketplace listings...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" />
            Marketplace Listings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Etsy & Gumroad-ready titles, descriptions, and tags
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant={hasListings ? 'secondary' : 'primary'}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : hasListings ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Listings
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!hasListings && !generating ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No marketplace listings yet. Click "Generate Listings" to create them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {productLevels.map(level => {
            const listing = listings[level]
            const product = funnel[level]

            if (!listing || !product) return null

            return (
              <ProductListing
                key={level}
                level={level}
                listing={listing}
                productName={product.name}
                expanded={expandedProduct === level}
                onToggle={() => setExpandedProduct(
                  expandedProduct === level ? null : level
                )}
              />
            )
          })}
        </div>
      )}
    </Card>
  )
}
