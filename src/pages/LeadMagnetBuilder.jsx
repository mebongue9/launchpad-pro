// /src/pages/LeadMagnetBuilder.jsx
// AI-powered lead magnet generation page with background job processing
// Uses job-based approach to avoid 504 timeouts with real-time progress
// RELEVANT FILES: src/hooks/useGenerationJob.jsx, process-generation-background.js

import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProfiles } from '../hooks/useProfiles'
import { useAudiences } from '../hooks/useAudiences'
import { useFunnels } from '../hooks/useFunnels'
import { useExistingProducts } from '../hooks/useExistingProducts'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useLeadMagnetIdeasJob, useLeadMagnetContentJob } from '../hooks/useGenerationJob'
import { useToast } from '../components/ui/Toast'
import { Magnet, Sparkles, Check, Loader2, FileText, Tag, ArrowRight, AlertCircle, RefreshCw, Package } from 'lucide-react'

// Progress bar component for generation
function GenerationProgress({ progress, currentChunk, completedChunks, totalChunks, status }) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          {currentChunk || 'Starting...'}
        </span>
        <span className="text-gray-500">
          {totalChunks ? `${completedChunks || 0}/${totalChunks} sections` : `${progress}%`}
        </span>
      </div>

      {/* Retry indicator */}
      {currentChunk?.includes('Retry') && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <RefreshCw className="w-4 h-4" />
          <span>Automatic retry in progress...</span>
        </div>
      )}
    </div>
  )
}

// Error display with retry button
function GenerationError({ error, canResume, onRetry, onCancel }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-red-800">Generation Failed</h4>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          {canResume && (
            <p className="text-sm text-red-600 mt-1">
              Some progress was saved. You can try resuming.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            {canResume && (
              <Button variant="secondary" onClick={onRetry} className="text-sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Resume Generation
              </Button>
            )}
            <Button variant="secondary" onClick={onCancel} className="text-sm">
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadMagnetBuilder() {
  const { profiles } = useProfiles()
  const { audiences } = useAudiences()
  const { funnels } = useFunnels()
  const { products } = useExistingProducts()
  const { leadMagnets, saveLeadMagnet, getExcludedTopics } = useLeadMagnets()
  const { addToast } = useToast()

  // Use job-based generation hooks
  const ideasJob = useLeadMagnetIdeasJob()
  const contentJob = useLeadMagnetContentJob()

  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedAudience, setSelectedAudience] = useState(null)
  const [destinationType, setDestinationType] = useState('funnel') // 'funnel' or 'product'
  const [selectedFunnel, setSelectedFunnel] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [step, setStep] = useState(1)
  const [ideas, setIdeas] = useState([])
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [ideasToastShown, setIdeasToastShown] = useState(false)
  const [contentToastShown, setContentToastShown] = useState(false)

  // Get the target product based on destination type
  const targetProduct = destinationType === 'funnel'
    ? (selectedFunnel ? funnels.find(f => f.id === selectedFunnel)?.front_end : null)
    : (selectedProduct ? products.find(p => p.id === selectedProduct) : null)

  // Legacy alias for backward compatibility
  const frontEndProduct = targetProduct

  // Watch for ideas job completion
  useEffect(() => {
    if (ideasJob.status === 'complete' && ideasJob.result && !ideasToastShown) {
      setIdeas(ideasJob.result.ideas || [])
      setStep(2)
      setIdeasToastShown(true)
      addToast('Ideas generated!', 'success')
    }
  }, [ideasJob.status, ideasJob.result, ideasToastShown, addToast])

  // Watch for content job completion
  useEffect(() => {
    if (contentJob.status === 'complete' && contentJob.result && !contentToastShown) {
      setGeneratedContent({ ...contentJob.result, ...selectedIdea })
      setStep(3)
      setContentToastShown(true)
      addToast('Content generated!', 'success')
    }
  }, [contentJob.status, contentJob.result, selectedIdea, contentToastShown, addToast])

  async function handleGenerateIdeas() {
    // Validate required fields based on destination type
    if (!selectedProfile) {
      addToast('Please select a profile', 'error')
      return
    }

    if (destinationType === 'funnel' && !selectedFunnel) {
      addToast('Please select a funnel', 'error')
      return
    }

    if (destinationType === 'product' && !selectedProduct) {
      addToast('Please select a product', 'error')
      return
    }

    if (!targetProduct) {
      addToast('Please select a destination', 'error')
      return
    }

    setIdeas([])
    setIdeasToastShown(false)

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)
      const excludedTopics = await getExcludedTopics(selectedProfile)

      await ideasJob.generateIdeas(profile, audience, targetProduct, excludedTopics)
    } catch (error) {
      addToast(error.message || 'Failed to start generation', 'error')
    }
  }

  function handleSelectIdea(idea) {
    if (selectedIdea?.title === idea.title) {
      setSelectedIdea(null)
    } else {
      setSelectedIdea(idea)
    }
  }

  async function handleGenerateContent() {
    if (!selectedIdea) {
      addToast('Please select an idea first', 'error')
      return
    }

    setContentToastShown(false)

    try {
      const profile = profiles.find(p => p.id === selectedProfile)
      const audience = audiences.find(a => a.id === selectedAudience)

      await contentJob.generateContent(selectedIdea, profile, audience, frontEndProduct)
    } catch (error) {
      addToast(error.message || 'Failed to start generation', 'error')
    }
  }

  async function handleSave() {
    if (!generatedContent) return

    setSaving(true)
    try {
      await saveLeadMagnet(generatedContent, selectedProfile, selectedFunnel)
      addToast('Lead magnet saved!', 'success')
      handleReset()
    } catch (error) {
      addToast(error.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setStep(1)
    setIdeas([])
    setSelectedIdea(null)
    setGeneratedContent(null)
    setSelectedProfile(null)
    setDestinationType('funnel')
    setSelectedFunnel(null)
    setSelectedProduct(null)
    setIdeasToastShown(false)
    setContentToastShown(false)
    ideasJob.cancelJob()
    contentJob.cancelJob()
  }

  function handleBack() {
    if (step === 3) {
      setStep(2)
      setGeneratedContent(null)
      contentJob.cancelJob()
    } else if (step === 2) {
      setStep(1)
      setIdeas([])
      ideasJob.cancelJob()
    }
  }

  // Check if any generation is in progress
  const isGenerating = ideasJob.isActive || contentJob.isActive
  const currentJobError = ideasJob.error || contentJob.error
  const currentCanResume = ideasJob.canResume || contentJob.canResume

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Magnet Builder</h1>
        <p className="text-gray-500 mt-1">
          Create high-converting lead magnets that feed into your funnels
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          1. Select
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          2. Choose Idea
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          3. Review & Save
        </span>
      </div>

      {/* Generation Progress (shown during any active job) */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <h3 className="font-semibold text-gray-900 mb-4">
            {ideasJob.isActive ? 'Generating Ideas...' : 'Generating Content...'}
          </h3>
          <GenerationProgress
            progress={ideasJob.isActive ? ideasJob.progress : contentJob.progress}
            currentChunk={ideasJob.isActive ? ideasJob.currentChunk : contentJob.currentChunk}
            completedChunks={ideasJob.isActive ? ideasJob.completedChunks : contentJob.completedChunks}
            totalChunks={ideasJob.isActive ? ideasJob.totalChunks : contentJob.totalChunks}
            status={ideasJob.isActive ? ideasJob.status : contentJob.status}
          />
        </Card>
      )}

      {/* Error Display */}
      {currentJobError && !isGenerating && (
        <GenerationError
          error={currentJobError}
          canResume={currentCanResume}
          onRetry={() => {
            if (ideasJob.error) {
              ideasJob.resumeJob(ideasJob.jobId)
            } else if (contentJob.error) {
              contentJob.resumeJob(contentJob.jobId)
            }
          }}
          onCancel={handleReset}
        />
      )}

      {/* Step 1: Selection */}
      {step === 1 && !isGenerating && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Create New Lead Magnet</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Profile *
              </label>
              <select
                value={selectedProfile || ''}
                onChange={(e) => setSelectedProfile(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a profile...</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Audience
              </label>
              <select
                value={selectedAudience || ''}
                onChange={(e) => setSelectedAudience(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an audience...</option>
                {audiences.map(audience => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Magnet Destination *
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                destinationType === 'funnel'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="destinationType"
                  value="funnel"
                  checked={destinationType === 'funnel'}
                  onChange={(e) => {
                    setDestinationType(e.target.value)
                    setSelectedProduct(null)
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Funnel</span>
                  <p className="text-sm text-gray-500">Lead magnet feeds into a complete funnel</p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                destinationType === 'product'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="destinationType"
                  value="product"
                  checked={destinationType === 'product'}
                  onChange={(e) => {
                    setDestinationType(e.target.value)
                    setSelectedFunnel(null)
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-medium text-gray-900">Direct to Product</span>
                    <p className="text-sm text-gray-500">Lead magnet goes straight to your product</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Funnel or Product Selector based on destination type */}
          <div className="mb-6">
            {destinationType === 'funnel' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Funnel *
                </label>
                <select
                  value={selectedFunnel || ''}
                  onChange={(e) => setSelectedFunnel(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a funnel...</option>
                  {funnels.map(funnel => (
                    <option key={funnel.id} value={funnel.id}>
                      {funnel.name} - ${funnel.front_end?.price}
                    </option>
                  ))}
                </select>
                {funnels.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No funnels yet. Create a funnel first or select "Direct to Product".
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product *
                </label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No products yet. Add a product or select "Funnel" destination.
                  </p>
                )}
              </div>
            )}
          </div>

          {targetProduct && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Lead magnet will lead to:</strong> {targetProduct.name} (${targetProduct.price})
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerateIdeas}
            disabled={!selectedProfile || !targetProduct}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate 3 Ideas
          </Button>
        </Card>
      )}

      {/* Step 2: Choose Idea */}
      {step === 2 && ideas.length > 0 && !isGenerating && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Choose Your Lead Magnet</h2>
            <Button variant="secondary" onClick={handleBack}>
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ideas.map((idea, index) => {
              const isSelected = selectedIdea?.title === idea.title
              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectIdea(idea)}
                >
                  {isSelected && (
                    <div className="flex items-center gap-1 mb-2 text-blue-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">{idea.keyword}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{idea.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{idea.topic}</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{idea.format}</span>
                  <p className="text-xs text-gray-500 mt-3 italic">{idea.why_it_works}</p>
                </div>
              )
            })}
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleGenerateContent}
              disabled={!selectedIdea}
              className="px-8"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {selectedIdea ? `Generate "${selectedIdea.keyword}" Content` : 'Select an Idea Above'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Preview & Save */}
      {step === 3 && generatedContent && !isGenerating && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{generatedContent.title}</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleBack}>
                ← Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Lead Magnet
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{generatedContent.subtitle}</p>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Content Preview</h3>
            {generatedContent.sections?.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <p className="text-xs text-blue-600 uppercase mb-1">{section.type}</p>
                <h4 className="font-medium">{section.title}</h4>
                {section.content && (
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {generatedContent.promotion_kit && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Promotion Kit</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Keyword</p>
                  <p className="font-medium">{generatedContent.promotion_kit.keyword}</p>
                </div>
                {generatedContent.promotion_kit.captions?.comment_version && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Instagram Caption</p>
                    <p className="text-sm text-gray-700">{generatedContent.promotion_kit.captions.comment_version}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Existing Lead Magnets */}
      {leadMagnets.length > 0 && step === 1 && !isGenerating && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Your Lead Magnets</h2>
          <div className="space-y-3">
            {leadMagnets.map(lm => (
              <div key={lm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{lm.name}</h3>
                    <p className="text-sm text-gray-500">
                      Keyword: {lm.keyword} • {lm.format}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {step === 1 && leadMagnets.length === 0 && funnels.length === 0 && products.length === 0 && !isGenerating && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Magnet className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create a Funnel or Add a Product First
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Lead magnets are designed to drive traffic to your products.
            Create a funnel or add an existing product, then generate lead magnets for it.
          </p>
        </Card>
      )}
    </div>
  )
}
