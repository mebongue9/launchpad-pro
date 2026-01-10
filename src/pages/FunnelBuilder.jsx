// /src/pages/FunnelBuilder.jsx
// Funnel creation page - generates FUNNEL IDEAS only (not content)
// Content generation happens in Lead Magnet Builder when user clicks "Generate"
// RELEVANT FILES: src/hooks/useFunnels.jsx, netlify/functions/generate-funnel.js

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProfiles } from '../hooks/useProfiles'
import { useAudiences } from '../hooks/useAudiences'
import { useFunnels } from '../hooks/useFunnels'
import { useExistingProducts } from '../hooks/useExistingProducts'
import { useToast } from '../components/ui/Toast'
import LanguageSelector from '../components/common/LanguageSelector'
import { DEFAULT_FAVORITE_LANGUAGES } from '../lib/languages'
import {
  Rocket,
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
  DollarSign,
  Package,
  Wand2,
  ClipboardPaste,
  ArrowLeft,
  AlertCircle,
  Trash2,
  Eye,
  Edit3,
  X,
  FileText
} from 'lucide-react'
import { parseFunnelText, getExamplePasteFormat } from '../lib/utils'
import FunnelCard from '../components/funnel/FunnelCard'
import FunnelFilters, { FunnelStats } from '../components/funnel/FunnelFilters'
import DocumentGenerationProgress from '../components/funnel/DocumentGenerationProgress'
import { AdminRagLogsPanel } from '../components/AdminRagLogsPanel'

export default function FunnelBuilder() {
  const navigate = useNavigate()
  const { profiles, loading: profilesLoading } = useProfiles()
  const { audiences, loading: audiencesLoading } = useAudiences()
  const { products: existingProducts } = useExistingProducts()
  const { funnels, saveFunnel, deleteFunnel, loading: funnelsLoading, documentJob, generateFunnel } = useFunnels()
  const { addToast } = useToast()

  // Generation state (for ideas only - not full content)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)

  // Mode: null = choose, 'ai' = AI generation, 'manual' = manual entry
  const [mode, setMode] = useState(null)

  // AI Generation state
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedAudience, setSelectedAudience] = useState(null)
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [frontEndLink, setFrontEndLink] = useState('')
  const [generatedFunnel, setGeneratedFunnel] = useState(null)

  // Funnel management state
  const [viewingFunnel, setViewingFunnel] = useState(null)
  const [deletingFunnel, setDeletingFunnel] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filter and view state
  const [filters, setFilters] = useState({
    search: '',
    profileId: '',
    audienceId: '',
    productId: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  const [viewMode, setViewMode] = useState('list')
  const [sortBy, setSortBy] = useState('newest')

  // Filter and sort funnels
  const filteredFunnels = useMemo(() => {
    let result = [...funnels]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(f =>
        f.name?.toLowerCase().includes(searchLower) ||
        f.profiles?.name?.toLowerCase().includes(searchLower) ||
        f.audiences?.name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.profileId) {
      result = result.filter(f => f.profile_id === filters.profileId)
    }

    if (filters.audienceId) {
      result = result.filter(f => f.audience_id === filters.audienceId)
    }

    if (filters.productId) {
      result = result.filter(f => f.existing_product_id === filters.productId)
    }

    if (filters.status) {
      result = result.filter(f => f.status === filters.status)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(f => new Date(f.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(f => new Date(f.created_at) <= toDate)
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'alpha_asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'alpha_desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
        break
      case 'updated':
        result.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
    }

    return result
  }, [funnels, filters, sortBy])

  // Manual Entry state
  const [manualFunnel, setManualFunnel] = useState({
    funnel_name: '',
    lead_magnet: { name: '', description: '', keyword: '' },
    front_end: { name: '', price: '', description: '', format: '' },
    bump: { name: '', price: '', description: '', format: '' },
    upsell_1: { name: '', price: '', description: '', format: '' }
  })

  // Paste mode state (FIX 3)
  const [pasteText, setPasteText] = useState('')
  const [parsedFunnel, setParsedFunnel] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [showPasteMode, setShowPasteMode] = useState(true) // Default to paste mode

  const [saving, setSaving] = useState(false)

  // Track if we've already shown toast for current funnel
  const toastShownForFunnelRef = useRef(null)

  // AI Generation handler - generates IDEAS only (not content)
  // Content generation happens in Lead Magnet Builder when user clicks "Generate"
  async function handleGenerate() {
    if (!selectedProfile || !selectedAudience) {
      addToast('Please select a profile and audience', 'error')
      return
    }

    setGeneratedFunnel(null)
    setIsGenerating(true)
    setGenerationError(null)
    toastShownForFunnelRef.current = null

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)
      const existingProduct = selectedExistingProduct
        ? existingProducts.find(p => p.id === selectedExistingProduct)
        : null

      // Generate funnel IDEA only (1 API call) - NOT full content
      addToast('Generating funnel idea...', 'info')
      const result = await generateFunnel(profile, audience, existingProduct)

      // Generation complete - result is the funnel IDEA (names, prices, formats)
      if (result) {
        setGeneratedFunnel(result)
        addToast('Funnel idea generated! Review and save as draft.', 'success')
      }
    } catch (error) {
      setGenerationError(error.message)
      addToast(error.message || 'Failed to generate funnel idea', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save AI-generated funnel
  async function handleSaveGenerated() {
    if (!generatedFunnel) return

    setSaving(true)
    try {
      await saveFunnel(
        generatedFunnel,
        selectedProfile,
        selectedAudience,
        selectedExistingProduct,
        selectedLanguage,
        frontEndLink
      )
      addToast('Funnel saved!', 'success')
      resetAll()
    } catch (error) {
      addToast(error.message || 'Failed to save funnel', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Save manual funnel
  async function handleSaveManual() {
    if (!manualFunnel.funnel_name || !manualFunnel.front_end.name) {
      addToast('Please fill in at least the funnel name and front-end product', 'error')
      return
    }

    setSaving(true)
    try {
      const funnelData = {
        funnel_name: manualFunnel.funnel_name,
        front_end: {
          name: manualFunnel.front_end.name,
          price: parseFloat(manualFunnel.front_end.price) || 17,
          description: manualFunnel.front_end.description,
          format: manualFunnel.front_end.format || 'digital product'
        },
        bump: manualFunnel.bump.name ? {
          name: manualFunnel.bump.name,
          price: parseFloat(manualFunnel.bump.price) || 9,
          description: manualFunnel.bump.description,
          format: manualFunnel.bump.format || 'templates'
        } : null,
        upsell_1: manualFunnel.upsell_1.name ? {
          name: manualFunnel.upsell_1.name,
          price: parseFloat(manualFunnel.upsell_1.price) || 67,
          description: manualFunnel.upsell_1.description,
          format: manualFunnel.upsell_1.format || 'course'
        } : null
      }

      if (manualFunnel.lead_magnet.name) {
        funnelData.lead_magnet = {
          name: manualFunnel.lead_magnet.name,
          keyword: manualFunnel.lead_magnet.keyword,
          description: manualFunnel.lead_magnet.description
        }
      }

      await saveFunnel(funnelData, selectedProfile, selectedAudience, null)
      addToast('Funnel saved!', 'success')
      resetAll()
    } catch (error) {
      addToast(error.message || 'Failed to save funnel', 'error')
    } finally {
      setSaving(false)
    }
  }

  function resetAll() {
    setMode(null)
    setGeneratedFunnel(null)
    setSelectedProfile(null)
    setSelectedAudience(null)
    setSelectedExistingProduct(null)
    setSelectedLanguage('English')
    setFrontEndLink('')
    setIsGenerating(false)
    setGenerationError(null)
    setManualFunnel({
      funnel_name: '',
      lead_magnet: { name: '', description: '', keyword: '' },
      front_end: { name: '', price: '', description: '', format: '' },
      bump: { name: '', price: '', description: '', format: '' },
      upsell_1: { name: '', price: '', description: '', format: '' }
    })
    // Reset paste state (FIX 3)
    setPasteText('')
    setParsedFunnel(null)
    setParseError(null)
    setShowPasteMode(true)
  }

  // Handle paste text parsing (FIX 3)
  function handleParsePaste() {
    setParseError(null)
    setParsedFunnel(null)

    const result = parseFunnelText(pasteText)

    if (result.success) {
      setParsedFunnel(result.data)
      addToast(`Parsed ${result.summary.productsFound} products successfully!`, 'success')
    } else {
      setParseError(result.error)
      addToast('Could not parse funnel text', 'error')
    }
  }

  // Save parsed funnel (FIX 3)
  async function handleSaveParsed() {
    if (!parsedFunnel) return

    setSaving(true)
    try {
      await saveFunnel(parsedFunnel, selectedProfile, selectedAudience, null, 'English', frontEndLink)
      addToast('Funnel saved!', 'success')
      resetAll()
    } catch (error) {
      addToast(error.message || 'Failed to save funnel', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Handle funnel deletion
  async function handleDeleteFunnel() {
    if (!deletingFunnel) return

    setDeleteLoading(true)
    try {
      await deleteFunnel(deletingFunnel.id)
      addToast('Funnel deleted successfully', 'success')
      setDeletingFunnel(null)
    } catch (error) {
      addToast(error.message || 'Failed to delete funnel', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  function updateManualField(section, field, value) {
    setManualFunnel(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value
    }))
  }

  // Only 2 upsells - user's existing product becomes Upsell 3 destination
  const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2']
  const productLabels = {
    front_end: 'Front-End',
    bump: 'Bump',
    upsell_1: 'Upsell 1',
    upsell_2: 'Upsell 2'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funnel Builder</h1>
        <p className="text-gray-500 mt-1">
          Create product funnels with AI or enter your existing funnels
        </p>
      </div>

      {/* Generation Progress - Simple Loading (ideas only) */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Generating Funnel Idea...</h3>
              <p className="text-sm text-gray-500">Creating product names, prices, and formats</p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {generationError && !isGenerating && (
        <Card className="border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">Generation Failed</h4>
              <p className="text-sm text-red-600 mt-1">{generationError}</p>
              <Button variant="secondary" onClick={resetAll} className="mt-3 text-sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Admin RAG Logs Panel */}
      <AdminRagLogsPanel isGenerating={isGenerating} />

      {/* Mode Selection */}
      {mode === null && !generatedFunnel && !isGenerating && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">How would you like to create your funnel?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('ai')}
              className="p-6 border-2 border-gray-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200">
                <Wand2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Generate with AI</h3>
              <p className="text-sm text-gray-500">
                Let AI create a funnel based on your profile and audience
              </p>
            </button>

            <button
              onClick={() => setMode('manual')}
              className="p-6 border-2 border-gray-200 rounded-lg text-left hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200">
                <ClipboardPaste className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Enter Existing Funnel</h3>
              <p className="text-sm text-gray-500">
                Paste or type your pre-built funnel directly
              </p>
            </button>
          </div>
        </Card>
      )}

      {/* AI Generation Mode */}
      {mode === 'ai' && !generatedFunnel && !isGenerating && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setMode(null)} className="p-1 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold">Generate with AI</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Profile *
              </label>
              <select
                value={selectedProfile || ''}
                onChange={(e) => setSelectedProfile(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={profilesLoading}
              >
                <option value="">Choose a profile...</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} {profile.business_name && `(${profile.business_name})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Audience *
              </label>
              <select
                value={selectedAudience || ''}
                onChange={(e) => setSelectedAudience(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={audiencesLoading}
              >
                <option value="">Choose an audience...</option>
                {audiences.map(audience => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final Upsell Destination (Optional)
              </label>
              <select
                value={selectedExistingProduct || ''}
                onChange={(e) => setSelectedExistingProduct(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None - create new</option>
                {existingProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (${product.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Front-End Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Front-End Link
            </label>
            <input
              type="url"
              value={frontEndLink}
              onChange={(e) => setFrontEndLink(e.target.value)}
              placeholder="https://yoursite.com/front-end-product"
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Where will your front-end product be sold? Use a redirect link you control.
            </p>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <LanguageSelector
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              favoriteLanguages={
                profiles.find(p => p.id === selectedProfile)?.favorite_languages ||
                DEFAULT_FAVORITE_LANGUAGES
              }
              label="Output Language"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!selectedProfile || !selectedAudience}
            className="w-full md:w-auto"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Funnel
          </Button>
        </Card>
      )}

      {/* Manual Entry Mode with Paste Option (FIX 3) */}
      {mode === 'manual' && !isGenerating && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setMode(null)} className="p-1 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold">Enter Your Existing Funnel</h2>
          </div>

          {/* Toggle between Paste and Manual Entry */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setShowPasteMode(true); setParsedFunnel(null); setParseError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                showPasteMode
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste Text
            </button>
            <button
              onClick={() => { setShowPasteMode(false); setParsedFunnel(null); setParseError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                !showPasteMode
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Manual Entry
            </button>
          </div>

          {/* PASTE MODE (FIX 3) */}
          {showPasteMode && !parsedFunnel && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your funnel text below
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={getExamplePasteFormat()}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: PRODUCT-TYPE: Product Name - Format ($Price)
                </p>
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 whitespace-pre-line">{parseError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleParsePaste} disabled={!pasteText.trim()}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse & Preview
                </Button>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* PARSED FUNNEL PREVIEW (FIX 3) */}
          {showPasteMode && parsedFunnel && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Parsed Successfully!</h3>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Review the parsed products below, then save your funnel.
                </p>

                <div className="space-y-3">
                  {parsedFunnel.front_end && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <span className="text-xs font-bold text-blue-600 uppercase w-20">Front-End</span>
                      <span className="flex-1 font-medium">{parsedFunnel.front_end.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{parsedFunnel.front_end.format}</span>
                      <span className="text-green-600 font-semibold">${parsedFunnel.front_end.price}</span>
                    </div>
                  )}
                  {parsedFunnel.bump && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <span className="text-xs font-bold text-green-600 uppercase w-20">Bump</span>
                      <span className="flex-1 font-medium">{parsedFunnel.bump.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{parsedFunnel.bump.format}</span>
                      <span className="text-green-600 font-semibold">${parsedFunnel.bump.price}</span>
                    </div>
                  )}
                  {parsedFunnel.upsell_1 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <span className="text-xs font-bold text-orange-600 uppercase w-20">Upsell 1</span>
                      <span className="flex-1 font-medium">{parsedFunnel.upsell_1.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{parsedFunnel.upsell_1.format}</span>
                      <span className="text-green-600 font-semibold">${parsedFunnel.upsell_1.price}</span>
                    </div>
                  )}
                  {parsedFunnel.upsell_2 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <span className="text-xs font-bold text-orange-600 uppercase w-20">Upsell 2</span>
                      <span className="flex-1 font-medium">{parsedFunnel.upsell_2.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{parsedFunnel.upsell_2.format}</span>
                      <span className="text-green-600 font-semibold">${parsedFunnel.upsell_2.price}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Front-End Link - Paste Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Front-End Link
                </label>
                <input
                  type="url"
                  value={frontEndLink}
                  onChange={(e) => setFrontEndLink(e.target.value)}
                  placeholder="https://yoursite.com/front-end-product"
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Where will your front-end product be sold? Use a redirect link you control.
                </p>
              </div>

              {/* Optional Profile/Audience Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile (Optional)
                  </label>
                  <select
                    value={selectedProfile || ''}
                    onChange={(e) => setSelectedProfile(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No profile</option>
                    {profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>{profile.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audience (Optional)
                  </label>
                  <select
                    value={selectedAudience || ''}
                    onChange={(e) => setSelectedAudience(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No audience</option>
                    {audiences.map(audience => (
                      <option key={audience.id} value={audience.id}>{audience.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveParsed} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Funnel
                    </>
                  )}
                </Button>
                <Button variant="secondary" onClick={() => { setParsedFunnel(null); setPasteText('') }}>
                  Parse Different Text
                </Button>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* MANUAL ENTRY MODE (Original) */}
          {!showPasteMode && (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Fill in each section below manually.
              </p>

          {/* Funnel Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funnel Name *
            </label>
            <input
              type="text"
              value={manualFunnel.funnel_name}
              onChange={(e) => setManualFunnel(prev => ({ ...prev, funnel_name: e.target.value }))}
              placeholder="e.g., Instagram Stories Funnel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Optional Profile/Audience Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile (Optional)
              </label>
              <select
                value={selectedProfile || ''}
                onChange={(e) => setSelectedProfile(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">No profile</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience (Optional)
              </label>
              <select
                value={selectedAudience || ''}
                onChange={(e) => setSelectedAudience(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">No audience</option>
                {audiences.map(audience => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {/* Lead Magnet */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold">0</span>
                Lead Magnet (FREE)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={manualFunnel.lead_magnet.name}
                  onChange={(e) => updateManualField('lead_magnet', 'name', e.target.value)}
                  placeholder="Lead magnet name"
                  className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={manualFunnel.lead_magnet.keyword}
                  onChange={(e) => updateManualField('lead_magnet', 'keyword', e.target.value.toUpperCase())}
                  placeholder="Keyword (e.g., STORIES)"
                  className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={manualFunnel.lead_magnet.description}
                  onChange={(e) => updateManualField('lead_magnet', 'description', e.target.value)}
                  placeholder="Brief description"
                  className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Front-End */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Front-End Product *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={manualFunnel.front_end.name}
                  onChange={(e) => updateManualField('front_end', 'name', e.target.value)}
                  placeholder="Product name *"
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={manualFunnel.front_end.price}
                  onChange={(e) => updateManualField('front_end', 'price', e.target.value)}
                  placeholder="Price (e.g., 17)"
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={manualFunnel.front_end.format}
                  onChange={(e) => updateManualField('front_end', 'format', e.target.value)}
                  placeholder="Format (e.g., ebook)"
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={manualFunnel.front_end.description}
                  onChange={(e) => updateManualField('front_end', 'description', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bump */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Bump (Optional add-on)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={manualFunnel.bump.name}
                  onChange={(e) => updateManualField('bump', 'name', e.target.value)}
                  placeholder="Bump product name"
                  className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  value={manualFunnel.bump.price}
                  onChange={(e) => updateManualField('bump', 'price', e.target.value)}
                  placeholder="Price (e.g., 9)"
                  className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={manualFunnel.bump.format}
                  onChange={(e) => updateManualField('bump', 'format', e.target.value)}
                  placeholder="Format (e.g., templates)"
                  className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={manualFunnel.bump.description}
                  onChange={(e) => updateManualField('bump', 'description', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Upsell */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Upsell
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={manualFunnel.upsell_1.name}
                  onChange={(e) => updateManualField('upsell_1', 'name', e.target.value)}
                  placeholder="Upsell product name"
                  className="px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  value={manualFunnel.upsell_1.price}
                  onChange={(e) => updateManualField('upsell_1', 'price', e.target.value)}
                  placeholder="Price (e.g., 67)"
                  className="px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  value={manualFunnel.upsell_1.format}
                  onChange={(e) => updateManualField('upsell_1', 'format', e.target.value)}
                  placeholder="Format (e.g., course)"
                  className="px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  value={manualFunnel.upsell_1.description}
                  onChange={(e) => updateManualField('upsell_1', 'description', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveManual} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Funnel
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
          </>
          )}
        </Card>
      )}

      {/* Generated Funnel Preview */}
      {generatedFunnel && !isGenerating && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">{generatedFunnel.funnel_name}</h2>
              <p className="text-sm text-gray-500">Review your generated funnel</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={resetAll}>
                Start Over
              </Button>
              <Button onClick={handleSaveGenerated} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Funnel
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {productLevels.map((level, index) => {
              const product = generatedFunnel[level]
              if (!product) return null

              return (
                <div key={level} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 uppercase">
                        {productLabels[level]}
                      </span>
                      <span className="flex items-center text-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {product.price}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {product.format}
                      </span>
                    </div>
                    {product.bridges_to && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <ChevronRight className="w-3 h-3" />
                        {product.bridges_to}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Existing Funnels with Filters */}
      {funnels.length > 0 && !isGenerating && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Funnels</h2>
          </div>

          {/* Document Generation Progress */}
          <DocumentGenerationProgress job={documentJob} />

          {/* Filters */}
          <FunnelFilters
            filters={filters}
            onFilterChange={setFilters}
            profiles={profiles}
            audiences={audiences}
            existingProducts={existingProducts}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Stats */}
          <div className="mt-4 mb-4">
            <FunnelStats funnels={filteredFunnels} />
          </div>

          {/* Funnel List/Grid */}
          {filteredFunnels.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredFunnels.map(funnel => (
                <FunnelCard
                  key={funnel.id}
                  funnel={funnel}
                  viewMode={viewMode}
                  onView={() => navigate(`/funnels/${funnel.id}`)}
                  onDelete={() => setDeletingFunnel(funnel)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No funnels match your filters.</p>
              <button
                onClick={() => setFilters({
                  search: '',
                  profileId: '',
                  audienceId: '',
                  productId: '',
                  status: '',
                  dateFrom: '',
                  dateTo: ''
                })}
                className="mt-2 text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFunnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Funnel</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deletingFunnel.name}</strong>"?
              All products and content in this funnel will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeletingFunnel(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteFunnel}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Funnel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Funnel Modal */}
      {viewingFunnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{viewingFunnel.name}</h3>
                <p className="text-sm text-gray-500">
                  {viewingFunnel.profiles?.name ? `${viewingFunnel.profiles.name} → ` : ''}
                  {viewingFunnel.audiences?.name || 'No audience'}
                </p>
              </div>
              <button
                onClick={() => setViewingFunnel(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {productLevels.map((level) => {
                const product = viewingFunnel[level]
                if (!product) return null

                return (
                  <div key={level} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 uppercase">
                          {productLabels[level]}
                        </span>
                        <span className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {product.price}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      {product.format && (
                        <span className="inline-block text-xs bg-gray-200 px-2 py-1 rounded mt-2">
                          {product.format}
                        </span>
                      )}
                      {product.bridges_to && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <ChevronRight className="w-3 h-3" />
                          {product.bridges_to}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                variant="danger"
                onClick={() => {
                  setViewingFunnel(null)
                  setDeletingFunnel(viewingFunnel)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setViewingFunnel(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {mode === null && !generatedFunnel && funnels.length === 0 && !isGenerating && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create Your First Funnel
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Choose "Generate with AI" to let us create a funnel for you, or
            "Enter Existing Funnel" to input your pre-built funnel.
          </p>
        </Card>
      )}
    </div>
  )
}
