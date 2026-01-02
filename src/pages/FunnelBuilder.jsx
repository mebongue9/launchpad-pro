// /src/pages/FunnelBuilder.jsx
// Funnel creation page with AI generation and manual entry options
// Team can paste existing funnels directly from Word docs
// RELEVANT FILES: src/hooks/useFunnels.jsx, src/hooks/useProfiles.jsx, src/hooks/useAudiences.jsx

import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProfiles } from '../hooks/useProfiles'
import { useAudiences } from '../hooks/useAudiences'
import { useFunnels } from '../hooks/useFunnels'
import { useExistingProducts } from '../hooks/useExistingProducts'
import { useToast } from '../components/ui/Toast'
import {
  Rocket,
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
  DollarSign,
  Package,
  FileText,
  Wand2,
  ClipboardPaste,
  ArrowLeft
} from 'lucide-react'

export default function FunnelBuilder() {
  const { profiles, loading: profilesLoading } = useProfiles()
  const { audiences, loading: audiencesLoading } = useAudiences()
  const { products: existingProducts } = useExistingProducts()
  const { funnels, generateFunnel, saveFunnel, loading: funnelsLoading } = useFunnels()
  const { showToast } = useToast()

  // Mode: null = choose, 'ai' = AI generation, 'manual' = manual entry
  const [mode, setMode] = useState(null)

  // AI Generation state
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedAudience, setSelectedAudience] = useState(null)
  const [selectedExistingProduct, setSelectedExistingProduct] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedFunnel, setGeneratedFunnel] = useState(null)

  // Manual Entry state
  const [manualFunnel, setManualFunnel] = useState({
    funnel_name: '',
    lead_magnet: { name: '', description: '', keyword: '' },
    front_end: { name: '', price: '', description: '', format: '' },
    bump: { name: '', price: '', description: '', format: '' },
    upsell_1: { name: '', price: '', description: '', format: '' }
  })

  const [saving, setSaving] = useState(false)

  // AI Generation handler
  async function handleGenerate() {
    if (!selectedProfile || !selectedAudience) {
      showToast('Please select a profile and audience', 'error')
      return
    }

    setGenerating(true)
    setGeneratedFunnel(null)

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)
      const existingProduct = selectedExistingProduct
        ? existingProducts.find(p => p.id === selectedExistingProduct)
        : null

      const funnel = await generateFunnel(profile, audience, existingProduct)
      setGeneratedFunnel(funnel)
      showToast('Funnel generated successfully!', 'success')
    } catch (error) {
      showToast(error.message || 'Failed to generate funnel', 'error')
    } finally {
      setGenerating(false)
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
        selectedExistingProduct
      )
      showToast('Funnel saved!', 'success')
      resetAll()
    } catch (error) {
      showToast(error.message || 'Failed to save funnel', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Save manual funnel
  async function handleSaveManual() {
    if (!manualFunnel.funnel_name || !manualFunnel.front_end.name) {
      showToast('Please fill in at least the funnel name and front-end product', 'error')
      return
    }

    setSaving(true)
    try {
      // Convert manual input to funnel format
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

      // Include lead magnet info in the funnel name/description if provided
      if (manualFunnel.lead_magnet.name) {
        funnelData.lead_magnet = {
          name: manualFunnel.lead_magnet.name,
          keyword: manualFunnel.lead_magnet.keyword,
          description: manualFunnel.lead_magnet.description
        }
      }

      await saveFunnel(funnelData, selectedProfile, selectedAudience, null)
      showToast('Funnel saved!', 'success')
      resetAll()
    } catch (error) {
      showToast(error.message || 'Failed to save funnel', 'error')
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
    setManualFunnel({
      funnel_name: '',
      lead_magnet: { name: '', description: '', keyword: '' },
      front_end: { name: '', price: '', description: '', format: '' },
      bump: { name: '', price: '', description: '', format: '' },
      upsell_1: { name: '', price: '', description: '', format: '' }
    })
  }

  function updateManualField(section, field, value) {
    setManualFunnel(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value
    }))
  }

  const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2', 'upsell_3']
  const productLabels = {
    front_end: 'Front-End',
    bump: 'Bump',
    upsell_1: 'Upsell 1',
    upsell_2: 'Upsell 2',
    upsell_3: 'Upsell 3'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funnel Builder</h1>
        <p className="text-gray-500 mt-1">
          Create product funnels with AI or enter your existing funnels
        </p>
      </div>

      {/* Mode Selection */}
      {mode === null && !generatedFunnel && (
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
      {mode === 'ai' && !generatedFunnel && (
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

          <Button
            onClick={handleGenerate}
            disabled={!selectedProfile || !selectedAudience || generating}
            className="w-full md:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Funnel...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Funnel
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Manual Entry Mode */}
      {mode === 'manual' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setMode(null)} className="p-1 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold">Enter Your Existing Funnel</h2>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Copy and paste your funnel details from your document. Fill in each section below.
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
        </Card>
      )}

      {/* Generated Funnel Preview */}
      {generatedFunnel && (
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

      {/* Existing Funnels */}
      {funnels.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Your Funnels</h2>
          <div className="space-y-3">
            {funnels.map(funnel => (
              <div
                key={funnel.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{funnel.name}</h3>
                  <p className="text-sm text-gray-500">
                    {funnel.profiles?.name ? `${funnel.profiles.name} → ` : ''}
                    {funnel.audiences?.name || 'No audience'}
                  </p>
                </div>
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${funnel.status === 'complete' ? 'bg-green-100 text-green-700' :
                    funnel.status === 'content_generated' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'}
                `}>
                  {funnel.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {mode === null && !generatedFunnel && funnels.length === 0 && (
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
