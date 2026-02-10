// src/pages/VisualBuilder.jsx
// Visual Builder - PDF Generator, Creative Lab, and Generated PDFs repository
// RELEVANT FILES: src/components/visual-builder/*.jsx, src/hooks/useCoverTemplates.js, src/hooks/useGeneratedPdfs.js

import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useProfiles } from '../hooks/useProfiles'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useCoverTemplates } from '../hooks/useCoverTemplates'
import { useToast } from '../components/ui/Toast'
import { TemplateSelector } from '../components/visual-builder/TemplateSelector'
import { PreviewPanel } from '../components/visual-builder/PreviewPanel'
import { StyleEditor } from '../components/visual-builder/StyleEditor'
import { GeneratedPdfsList } from '../components/visual-builder/GeneratedPdfsList'
import { CreativeLab } from '../components/cover-lab/CreativeLab'
import {
  Palette,
  FileText,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  Check,
  Wand2,
  FolderOpen,
  FlaskConical
} from 'lucide-react'

// Format ID to display label
function formatLabel(format) {
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

// Main tabs configuration
const MAIN_TABS = [
  { id: 'generator', label: 'PDF Generator', icon: Wand2 },
  { id: 'lab', label: 'Creative Lab', icon: FlaskConical },
  { id: 'generated', label: 'Generated PDFs', icon: FolderOpen }
]

export default function VisualBuilder() {
  const { user } = useAuth()
  const { profiles } = useProfiles()
  const { funnels } = useFunnels()
  const { leadMagnets } = useLeadMagnets()
  const { templates, loading: templatesLoading } = useCoverTemplates()
  const { addToast } = useToast()

  // Main tab state
  const [activeTab, setActiveTab] = useState('generator')

  // Flow state for PDF Generator
  const [step, setStep] = useState(1)

  // Step 1: Source selection
  const [sourceType, setSourceType] = useState(null) // 'funnel' or 'leadmagnet'
  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null) // for funnels: 'front_end', 'bump', etc.
  const [selectedProfile, setSelectedProfile] = useState(null)

  // Step 2: Template selection
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Step 3: Styling
  const [title, setTitle] = useState('')
  const [titleSize, setTitleSize] = useState(100)
  const [subtitle, setSubtitle] = useState('')
  const [subtitleSize, setSubtitleSize] = useState(100)
  const [authorName, setAuthorName] = useState('')
  const [authorSize, setAuthorSize] = useState(100)
  const [handle, setHandle] = useState('')
  const [handleSize, setHandleSize] = useState(100)

  // Product format (for preview highlighting)
  const [productFormat, setProductFormat] = useState(null)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null) // 'starting' | 'processing' | 'completed' | 'failed'
  const [generatedPdf, setGeneratedPdf] = useState(null) // { pdfUrl, coverPngUrl }

  // Get profile data for preview
  const profile = profiles.find(p => p.id === selectedProfile) || null

  // Pre-fill fields when source/profile changes
  useEffect(() => {
    if (sourceType === 'leadmagnet' && selectedSource) {
      const lm = leadMagnets.find(l => l.id === selectedSource)
      if (lm) {
        setTitle(lm.name || '')
        setSubtitle(lm.topic || '')
        setProductFormat(lm.format || null)
      }
    } else if (sourceType === 'funnel' && selectedSource && selectedProduct) {
      const funnel = funnels.find(f => f.id === selectedSource)
      if (funnel && funnel[selectedProduct]) {
        setTitle(funnel[selectedProduct].name || '')
        setSubtitle(funnel[selectedProduct].description?.substring(0, 100) || '')
        setProductFormat(funnel[selectedProduct].format || null)
      }
    } else {
      setProductFormat(null)
    }
  }, [sourceType, selectedSource, selectedProduct, leadMagnets, funnels])

  // Pre-fill author/handle from profile
  useEffect(() => {
    if (profile) {
      setAuthorName(profile.name || '')
      setHandle(profile.social_handle || profile.business_name || '')
    }
  }, [profile])

  // Get available products for selected funnel
  const getFunnelProducts = () => {
    if (!selectedSource) return []
    const funnel = funnels.find(f => f.id === selectedSource)
    if (!funnel) return []

    const products = []
    if (funnel.front_end) products.push({ type: 'front_end', label: 'Front-End', name: funnel.front_end.name, format: funnel.front_end.format })
    if (funnel.bump) products.push({ type: 'bump', label: 'Bump', name: funnel.bump.name, format: funnel.bump.format })
    if (funnel.upsell_1) products.push({ type: 'upsell_1', label: 'Upsell 1', name: funnel.upsell_1.name, format: funnel.upsell_1.format })
    if (funnel.upsell_2) products.push({ type: 'upsell_2', label: 'Upsell 2', name: funnel.upsell_2.name, format: funnel.upsell_2.format })
    return products
  }

  // Handle PDF generation
  async function handleGenerate() {
    if (!selectedTemplate || !title) {
      addToast('Please select a template and enter a title', 'error')
      return
    }

    setGenerating(true)
    setGenerationStatus('processing')
    setGeneratedPdf(null)

    // AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch('/.netlify/functions/visual-builder-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user?.id,
          profileId: selectedProfile,
          funnelId: sourceType === 'funnel' ? selectedSource : null,
          leadMagnetId: sourceType === 'leadmagnet' ? selectedSource : null,
          productType: selectedProduct,
          coverTemplateId: selectedTemplate.id,
          title,
          titleSize,
          subtitle,
          subtitleSize,
          authorName,
          authorSize,
          handle,
          handleSize
        })
      })

      clearTimeout(timeoutId)

      // Handle non-JSON responses (like HTML error pages from 504)
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 504) {
          throw new Error('Server timeout - please try again')
        }
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF')
      }

      // DocRaptor returns pdfUrl directly
      if (data.pdfUrl) {
        setGeneratedPdf({
          pdfUrl: data.pdfUrl,
          coverPngUrl: null,
          html: null
        })
        setGenerationStatus('completed')
        addToast('PDF generated! Click Download to save.', 'success')
      } else {
        throw new Error('No PDF URL returned')
      }

    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Generation error:', error)
      setGenerationStatus('failed')

      // Handle abort/timeout specifically
      if (error.name === 'AbortError') {
        addToast('Request timed out - please try again', 'error')
      } else {
        addToast(error.message || 'Failed to generate', 'error')
      }
    } finally {
      setGenerating(false)
    }
  }

  // Download PDF from server URL
  function handleDownloadPDF() {
    if (!generatedPdf?.pdfUrl) return
    window.open(generatedPdf.pdfUrl, '_blank')
    addToast('PDF opened in new tab', 'success')
  }

  // Reset everything
  function handleReset() {
    setStep(1)
    setSourceType(null)
    setSelectedSource(null)
    setSelectedProduct(null)
    setSelectedTemplate(null)
    setTitle('')
    setTitleSize(100)
    setSubtitle('')
    setSubtitleSize(100)
    setAuthorName('')
    setAuthorSize(100)
    setHandle('')
    setHandleSize(100)
    setProductFormat(null)
    setGeneratedPdf(null)
    setGenerationStatus(null)
  }

  // Can proceed to next step?
  const canProceedStep1 = sourceType && selectedSource && (sourceType === 'leadmagnet' || selectedProduct)
  const canProceedStep2 = selectedTemplate !== null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
        <p className="text-gray-500 mt-1">
          Transform your content into beautifully designed PDFs
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          {MAIN_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'generator' && (
        <>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          1. Select Content
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          2. Choose Template
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          3. Style & Generate
        </span>
      </div>

      {/* Step 1: Select Content */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Select Content to Design</h2>

          {/* Source type selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => { setSourceType('funnel'); setSelectedSource(null); setSelectedProduct(null) }}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                sourceType === 'funnel'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <FileText className={`w-8 h-8 mb-3 ${sourceType === 'funnel' ? 'text-purple-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Funnel Product</h3>
              <p className="text-sm text-gray-500 mt-1">
                Style a specific product from your funnel
              </p>
            </button>

            <button
              onClick={() => { setSourceType('leadmagnet'); setSelectedSource(null); setSelectedProduct(null) }}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                sourceType === 'leadmagnet'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <FileText className={`w-8 h-8 mb-3 ${sourceType === 'leadmagnet' ? 'text-purple-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Lead Magnet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Design your lead magnet as a professional PDF
              </p>
            </button>
          </div>

          {/* Funnel selection */}
          {sourceType === 'funnel' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Funnel</label>
                <select
                  value={selectedSource || ''}
                  onChange={(e) => { setSelectedSource(e.target.value || null); setSelectedProduct(null) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a funnel...</option>
                  {funnels.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {selectedSource && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {getFunnelProducts().map(product => (
                      <button
                        key={product.type}
                        onClick={() => setSelectedProduct(product.type)}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          selectedProduct === product.type
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-sm font-medium">{product.label}</div>
                        <div className="text-xs text-gray-500 truncate">{product.name}</div>
                        {product.format && (
                          <div className="text-xs text-blue-600 mt-1">{formatLabel(product.format)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lead magnet selection */}
          {sourceType === 'leadmagnet' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead Magnet</label>
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a lead magnet...</option>
                {leadMagnets.map(lm => (
                  <option key={lm.id} value={lm.id}>
                    {lm.name}{lm.format ? ` (${formatLabel(lm.format)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Profile selection */}
          {sourceType && selectedSource && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Branding Profile</label>
              <select
                value={selectedProfile || ''}
                onChange={(e) => setSelectedProfile(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No branding</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Next button */}
          {canProceedStep1 && (
            <Button onClick={() => setStep(2)}>
              Continue to Template Selection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </Card>
      )}

      {/* Step 2: Choose Template */}
      {step === 2 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Choose Cover Template</h2>
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <TemplateSelector
              templates={templates}
              selectedId={selectedTemplate?.id}
              onSelect={(template) => setSelectedTemplate(template)}
            />
          )}

          {canProceedStep2 && (
            <div className="mt-6">
              <Button onClick={() => setStep(3)}>
                Continue to Styling
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Style & Generate */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Back button */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            {generatedPdf && (
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="secondary" onClick={handleReset}>
                  Start Over
                </Button>
              </div>
            )}
          </div>

          {/* Compact controls at top */}
          <StyleEditor
            title={title}
            setTitle={setTitle}
            titleSize={titleSize}
            setTitleSize={setTitleSize}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            subtitleSize={subtitleSize}
            setSubtitleSize={setSubtitleSize}
            authorName={authorName}
            setAuthorName={setAuthorName}
            authorSize={authorSize}
            setAuthorSize={setAuthorSize}
            handle={handle}
            setHandle={setHandle}
            handleSize={handleSize}
            setHandleSize={setHandleSize}
          />

          {/* Large preview area */}
          <Card className="p-4" style={{ minHeight: '550px' }}>
            <PreviewPanel
              template={selectedTemplate}
              title={title}
              titleSize={titleSize}
              subtitle={subtitle}
              subtitleSize={subtitleSize}
              authorName={authorName}
              authorSize={authorSize}
              handle={handle}
              handleSize={handleSize}
              productFormat={productFormat}
              onGenerate={handleGenerate}
              generating={generating}
              generationStatus={generationStatus}
            />
          </Card>
        </div>
      )}

          {/* Empty State */}
          {step === 1 && funnels.length === 0 && leadMagnets.length === 0 && (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Content to Design
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Create a funnel or lead magnet first, then come back to transform
                it into a beautifully designed PDF.
              </p>
            </Card>
          )}
        </>
      )}

      {/* Creative Lab Tab */}
      {activeTab === 'lab' && (
        <CreativeLab />
      )}

      {/* Generated PDFs Tab */}
      {activeTab === 'generated' && (
        <GeneratedPdfsList />
      )}
    </div>
  )
}
