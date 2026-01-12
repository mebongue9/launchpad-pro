// /src/pages/FunnelDetails.jsx
// Funnel details page with tabs for products, marketplace, emails, and bundles
// Displays all information and export options for a single funnel
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, src/components/funnel/*.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useFunnels } from '../hooks/useFunnels'
import { useProfiles } from '../hooks/useProfiles'
import { useToast } from '../components/ui/Toast'
import ExportButtons from '../components/export/ExportButtons'
import MarketplaceListings from '../components/funnel/MarketplaceListings'
import EmailSequencePreview from '../components/funnel/EmailSequencePreview'
import BundlePreview from '../components/funnel/BundlePreview'
import ContentEditor from '../components/editor/ContentEditor'
import {
  ArrowLeft,
  Package,
  DollarSign,
  ShoppingBag,
  Mail,
  Gift,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  Edit3,
  Sparkles,
  Copy,
  Check,
  X,
  BookOpen
} from 'lucide-react'

// Tab definitions - Order: Products → Marketplace → Bundle → Emails → TLDR → Export
const TABS = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'bundle', label: 'Bundle', icon: Gift },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'tldr', label: 'TLDR', icon: Sparkles },
  { id: 'export', label: 'Export', icon: Download }
]

// Product level configuration
const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2']
const productLabels = {
  front_end: 'Front-End',
  bump: 'Bump',
  upsell_1: 'Upsell 1',
  upsell_2: 'Upsell 2'
}
const productColors = {
  front_end: 'blue',
  bump: 'green',
  upsell_1: 'orange',
  upsell_2: 'purple'
}

// Copy button component
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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

export default function FunnelDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { funnels, loading, updateFunnel } = useFunnels()
  const { profiles } = useProfiles()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('products')
  const [selectedProduct, setSelectedProduct] = useState('front_end')
  const [editingProduct, setEditingProduct] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [previewingProduct, setPreviewingProduct] = useState(null)
  const [expandedChapter, setExpandedChapter] = useState(0)

  // Find the funnel
  const funnel = funnels.find(f => f.id === id)
  const profile = funnel?.profile_id ? profiles.find(p => p.id === funnel.profile_id) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!funnel) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="secondary" onClick={() => navigate('/funnels')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Funnels
          </Button>
        </div>
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Funnel Not Found</h3>
          <p className="text-gray-500">This funnel doesn't exist or has been deleted.</p>
        </Card>
      </div>
    )
  }

  // Get current product data
  const currentProduct = funnel[selectedProduct]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/funnels')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{funnel.name}</h1>
            <p className="text-gray-500">
              {funnel.profiles?.name || 'No profile'} • {funnel.audiences?.name || 'No audience'}
            </p>
          </div>
        </div>
        <span className={`
          text-xs px-3 py-1 rounded-full
          ${funnel.status === 'complete' ? 'bg-green-100 text-green-700' :
            funnel.status === 'content_generated' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'}
        `}>
          {funnel.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Funnel Products</h3>
              {productLevels.map((level) => {
                const product = funnel[level]
                if (!product) return null
                const color = productColors[level]

                return (
                  <button
                    key={level}
                    onClick={() => setSelectedProduct(level)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${selectedProduct === level
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium text-${color}-600 uppercase`}>
                        {productLabels[level]}
                      </span>
                      <span className="flex items-center text-green-600 font-semibold text-sm">
                        <DollarSign className="w-3 h-3" />
                        {product.price}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mt-1">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {product.format}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Product Details */}
            <div className="lg:col-span-2">
              {currentProduct ? (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={`text-xs font-medium text-${productColors[selectedProduct]}-600 uppercase`}>
                        {productLabels[selectedProduct]}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">{currentProduct.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">${currentProduct.price}</span>
                      <p className="text-sm text-gray-500">{currentProduct.format}</p>
                    </div>
                  </div>

                  {currentProduct.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                      <p className="text-gray-600">{currentProduct.description}</p>
                    </div>
                  )}

                  {/* TLDR Summary */}
                  {funnel[`${selectedProduct}_tldr`] && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">TLDR Summary</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        {funnel[`${selectedProduct}_tldr`].what_it_is && (
                          <p><strong>What it is:</strong> {funnel[`${selectedProduct}_tldr`].what_it_is}</p>
                        )}
                        {funnel[`${selectedProduct}_tldr`].who_its_for && (
                          <p><strong>Who it's for:</strong> {funnel[`${selectedProduct}_tldr`].who_its_for}</p>
                        )}
                        {funnel[`${selectedProduct}_tldr`].key_benefits && (
                          <div>
                            <strong>Key benefits:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {funnel[`${selectedProduct}_tldr`].key_benefits.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cross-Promo */}
                  {funnel[`${selectedProduct}_cross_promo`] && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">Cross-Promo</h4>
                      <p className="text-sm text-purple-700">{funnel[`${selectedProduct}_cross_promo`]}</p>
                    </div>
                  )}

                  {currentProduct.bridges_to && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <ChevronRight className="w-4 h-4" />
                      <span>Bridges to: {currentProduct.bridges_to}</span>
                    </div>
                  )}

                  {/* Content Buttons */}
                  <div className="mt-6 pt-4 border-t flex gap-3">
                    {/* View Full Content - shows chapters preview modal */}
                    <Button
                      variant="secondary"
                      onClick={() => setPreviewingProduct(selectedProduct)}
                      className="flex-1"
                      disabled={!currentProduct.chapters || currentProduct.chapters.length === 0}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Content
                    </Button>
                    {/* Edit Content - opens editor with concatenated chapters */}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingProduct(selectedProduct)
                        // Load chapters content, not just description
                        const chapters = currentProduct.chapters || []
                        const fullContent = chapters.map(ch =>
                          `## ${ch.title || `Chapter ${ch.number}`}\n\n${ch.content || ''}`
                        ).join('\n\n---\n\n')
                        setEditorContent(fullContent || currentProduct.description || '')
                      }}
                      className="flex-1"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Content
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-12">
                  <p className="text-gray-500">Select a product to view details</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {productLevels.map((level) => {
              const product = funnel[level]
              if (!product) return null

              // Build content for this product
              const productContent = {
                title: product.name,
                description: product.description,
                sections: [
                  { title: 'Overview', content: product.description || '' }
                ]
              }

              // Add TLDR sections if available
              const tldr = funnel[`${level}_tldr`]
              if (tldr?.whats_inside) {
                productContent.sections.push({
                  title: "What's Inside",
                  items: tldr.whats_inside
                })
              }

              return (
                <Card key={level}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className={`text-xs font-medium text-${productColors[level]}-600 uppercase`}>
                        {productLabels[level]}
                      </span>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    </div>
                    <span className="text-green-600 font-semibold">${product.price}</span>
                  </div>

                  <ExportButtons
                    product={product}
                    profile={profile}
                    content={productContent}
                    options={{
                      includeCover: true,
                      includeReviewRequest: true,
                      includeCrossPromo: !!funnel[`${level}_cross_promo`],
                      crossPromoText: funnel[`${level}_cross_promo`]
                    }}
                    variant="compact"
                  />
                </Card>
              )
            })}
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <MarketplaceListings funnel={funnel} />
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <EmailSequencePreview funnelId={funnel.id} />
        )}

        {/* Bundle Tab */}
        {activeTab === 'bundle' && (
          <BundlePreview funnel={funnel} />
        )}

        {/* TLDR Tab - Shows all 4 product TLDRs */}
        {activeTab === 'tldr' && (
          <div className="space-y-6">
            {/* Copy All TLDRs Button */}
            <div className="flex justify-end">
              <CopyButton
                text={productLevels.map(level => {
                  const product = funnel[level]
                  const tldr = funnel[`${level}_tldr`]
                  if (!product || !tldr) return ''

                  let text = `=== ${productLabels[level].toUpperCase()}: ${product.name} ($${product.price}) ===\n\n`
                  if (tldr.what_it_is) text += `WHAT IT IS:\n${tldr.what_it_is}\n\n`
                  if (tldr.who_its_for) text += `WHO IT'S FOR:\n${tldr.who_its_for}\n\n`
                  if (tldr.problem_solved) text += `PROBLEM SOLVED:\n${tldr.problem_solved}\n\n`
                  if (tldr.whats_inside) {
                    const items = Array.isArray(tldr.whats_inside) ? tldr.whats_inside.join('\n• ') : tldr.whats_inside
                    text += `WHAT'S INSIDE:\n• ${items}\n\n`
                  }
                  if (tldr.key_benefits) {
                    const benefits = Array.isArray(tldr.key_benefits) ? tldr.key_benefits.join('\n• ') : tldr.key_benefits
                    text += `KEY BENEFITS:\n• ${benefits}\n\n`
                  }
                  if (tldr.cta) text += `CALL TO ACTION:\n${tldr.cta}\n\n`
                  return text
                }).filter(Boolean).join('\n' + '─'.repeat(50) + '\n\n')}
                label="Copy All TLDRs"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {productLevels.map((level) => {
              const product = funnel[level]
              const tldr = funnel[`${level}_tldr`]
              const color = productColors[level]

              if (!product) return null

              return (
                <Card key={level}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-5 h-5 text-${color}-500`} />
                      <span className={`text-xs font-medium text-${color}-600 uppercase`}>
                        {productLabels[level]}
                      </span>
                    </div>
                    <span className="text-green-600 font-semibold">${product.price}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-4">{product.name}</h3>

                  {!tldr ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No TLDR generated</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      {tldr.what_it_is && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">What It Is</span>
                            <CopyButton text={tldr.what_it_is} />
                          </div>
                          <p className="p-2 bg-gray-50 rounded text-gray-700">{tldr.what_it_is}</p>
                        </div>
                      )}

                      {tldr.who_its_for && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">Who It's For</span>
                            <CopyButton text={tldr.who_its_for} />
                          </div>
                          <p className="p-2 bg-gray-50 rounded text-gray-700">{tldr.who_its_for}</p>
                        </div>
                      )}

                      {tldr.problem_solved && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">Problem Solved</span>
                            <CopyButton text={tldr.problem_solved} />
                          </div>
                          <p className="p-2 bg-gray-50 rounded text-gray-700">{tldr.problem_solved}</p>
                        </div>
                      )}

                      {tldr.whats_inside && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">What's Inside</span>
                            <CopyButton text={Array.isArray(tldr.whats_inside) ? tldr.whats_inside.join(', ') : tldr.whats_inside} />
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            {Array.isArray(tldr.whats_inside) ? (
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {tldr.whats_inside.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700">{tldr.whats_inside}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {tldr.key_benefits && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">Key Benefits</span>
                            <CopyButton text={Array.isArray(tldr.key_benefits) ? tldr.key_benefits.join(', ') : tldr.key_benefits} />
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            {Array.isArray(tldr.key_benefits) ? (
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {tldr.key_benefits.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700">{tldr.key_benefits}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {tldr.cta && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">Call to Action</span>
                            <CopyButton text={tldr.cta} />
                          </div>
                          <p className={`p-2 bg-${color}-50 rounded text-${color}-700 font-medium`}>{tldr.cta}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
            </div>
          </div>
        )}
      </div>

      {/* Content Preview Modal - Shows all chapters */}
      {previewingProduct && funnel[previewingProduct] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <BookOpen className={`w-6 h-6 text-${productColors[previewingProduct]}-500`} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {funnel[previewingProduct]?.name || productLabels[previewingProduct]}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {(funnel[previewingProduct]?.chapters || []).length} chapters • {funnel[previewingProduct]?.format}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewingProduct(null)
                  setExpandedChapter(0)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Cover Data */}
              {funnel[previewingProduct]?.cover_data && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900">
                    {funnel[previewingProduct].cover_data.title || 'Cover'}
                  </h3>
                  {funnel[previewingProduct].cover_data.subtitle && (
                    <p className="text-gray-600 mt-1">{funnel[previewingProduct].cover_data.subtitle}</p>
                  )}
                  {funnel[previewingProduct].cover_data.tagline && (
                    <p className="text-sm text-purple-600 mt-2 italic">{funnel[previewingProduct].cover_data.tagline}</p>
                  )}
                </div>
              )}

              {/* Chapters */}
              <div className="space-y-3">
                {(funnel[previewingProduct]?.chapters || []).length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No content generated yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Generate funnel content to see chapters here.</p>
                  </div>
                ) : (
                  (funnel[previewingProduct]?.chapters || []).map((chapter, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-${productColors[previewingProduct]}-100 text-${productColors[previewingProduct]}-600 flex items-center justify-center text-sm font-semibold`}>
                            {chapter.number || idx + 1}
                          </div>
                          <span className="font-medium text-gray-900">
                            {chapter.title || `Chapter ${idx + 1}`}
                          </span>
                        </div>
                        {expandedChapter === idx
                          ? <ChevronUp className="w-5 h-5 text-gray-400" />
                          : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                      {expandedChapter === idx && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="flex justify-end mb-2">
                            <CopyButton text={chapter.content} label="Copy Content" />
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed max-h-80 overflow-y-auto">
                            {chapter.content || 'No content'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setPreviewingProduct(null)
                  setExpandedChapter(0)
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Switch to edit mode
                  const chapters = funnel[previewingProduct]?.chapters || []
                  const fullContent = chapters.map(ch =>
                    `## ${ch.title || `Chapter ${ch.number}`}\n\n${ch.content || ''}`
                  ).join('\n\n---\n\n')
                  setEditorContent(fullContent)
                  setEditingProduct(previewingProduct)
                  setPreviewingProduct(null)
                  setExpandedChapter(0)
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Content
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Editor Modal */}
      <ContentEditor
        isOpen={!!editingProduct}
        onClose={() => {
          setEditingProduct(null)
          setEditorContent('')
        }}
        content={editorContent}
        title={`Edit ${productLabels[editingProduct] || 'Content'}`}
        saving={savingContent}
        onSave={async (html) => {
          setSavingContent(true)
          try {
            // Update the product's content in the funnel
            const updatedProduct = { ...funnel[editingProduct], content: html }
            await updateFunnel(funnel.id, { [editingProduct]: updatedProduct })
            addToast('Content saved!', 'success')
            setEditingProduct(null)
            setEditorContent('')
          } catch (error) {
            console.error('Failed to save content:', error)
            addToast('Failed to save content', 'error')
          } finally {
            setSavingContent(false)
          }
        }}
      />
    </div>
  )
}
