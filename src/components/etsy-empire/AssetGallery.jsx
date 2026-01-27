// /src/components/etsy-empire/AssetGallery.jsx
// Grid view of generated images (thumbnails)
// Shows Etsy slides and Pinterest pins in tabs or sections
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, src/hooks/useEtsyEmpire.js

import { useState } from 'react'
import { Image, ShoppingBag, Pin, ExternalLink } from 'lucide-react'

export function AssetGallery({ assets = [], pinterestEnabled = true }) {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedImage, setSelectedImage] = useState(null)

  // Separate assets by type
  const etsyAssets = assets.filter(a => a.asset_type === 'etsy_slide')
  const pinterestAssets = assets.filter(a => a.asset_type === 'pinterest_pin')

  // Filter based on active tab
  const displayedAssets = activeTab === 'all'
    ? assets
    : activeTab === 'etsy'
      ? etsyAssets
      : pinterestAssets

  // Group Pinterest pins by category
  const groupedPinterest = pinterestAssets.reduce((acc, asset) => {
    const category = asset.asset_category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(asset)
    return acc
  }, {})

  if (assets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Image className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500">No images generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({assets.length})
        </button>
        <button
          onClick={() => setActiveTab('etsy')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'etsy'
              ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Etsy ({etsyAssets.length})
        </button>
        {pinterestEnabled && (
          <button
            onClick={() => setActiveTab('pinterest')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'pinterest'
                ? 'bg-pink-100 text-pink-700 border-b-2 border-pink-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Pin className="w-4 h-4" />
            Pinterest ({pinterestAssets.length})
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {displayedAssets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelectedImage(asset)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-purple-500 transition-all"
          >
            {asset.public_url ? (
              <img
                src={asset.public_url}
                alt={asset.asset_category || 'Generated image'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-300" />
              </div>
            )}

            {/* Type badge */}
            <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-xs font-medium rounded ${
              asset.asset_type === 'etsy_slide'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-pink-100 text-pink-700'
            }`}>
              {asset.asset_type === 'etsy_slide' ? 'E' : 'P'}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.public_url}
                alt={selectedImage.asset_category || 'Generated image'}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedImage.asset_category?.replace(/_/g, ' ') || 'Image'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedImage.asset_type === 'etsy_slide' ? 'Etsy Slide' : 'Pinterest Pin'}
                    {selectedImage.width && selectedImage.height && (
                      <span className="ml-2">
                        {selectedImage.width} x {selectedImage.height}
                      </span>
                    )}
                  </p>
                </div>
                <a
                  href={selectedImage.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Open Full Size
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
