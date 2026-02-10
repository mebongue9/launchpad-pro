// /src/components/etsy-empire/NewProjectModal.jsx
// Multi-step form for creating new Etsy Empire projects
// Steps: Upload → Details → Configure → Start
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, src/hooks/useEtsyEmpire.js

import { useState, useEffect } from 'react'
import {
  X,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Settings,
  Rocket,
  Check,
  Loader2,
  Pin,
  AlertCircle,
  Video,
  Image
} from 'lucide-react'
import { Button } from '../ui/Button'
import { PdfUploader } from './PdfUploader'
import { StyleRatioSlider } from './StyleRatioSlider'
import { useAuth } from '../../hooks/useAuth'

const STEPS = [
  { id: 1, label: 'Upload PDF', icon: Upload },
  { id: 2, label: 'Product Details', icon: FileText },
  { id: 3, label: 'Link to Funnel', icon: Settings },
  { id: 4, label: 'Configure Output', icon: Settings },
  { id: 5, label: 'Confirm & Start', icon: Rocket }
]

const PRODUCT_TYPES = [
  { value: 'lead_magnet', label: 'Lead Magnet' },
  { value: 'front_end', label: 'Front-End' },
  { value: 'bump', label: 'Bump' },
  { value: 'upsell_1', label: 'Upsell 1' },
  { value: 'upsell_2', label: 'Upsell 2' }
]

// Format options matching the 6 Launchpad Pro formats
const FORMAT_OPTIONS = [
  { value: 'checklist', label: 'Checklist' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'planner', label: 'Planner' },
  { value: 'swipe file', label: 'Swipe File' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'cheat sheet', label: 'Cheat Sheet' }
]

// Cost constants (kie.ai pricing)
const COST_PER_IMAGE = 0.02
const COST_PER_VIDEO = 0.10

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
  funnels = [],
  uploadPdf,
  submitting = false
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})

  // Form state
  const [pdfUrl, setPdfUrl] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [tldrText, setTldrText] = useState('')
  const [secondaryBenefits, setSecondaryBenefits] = useState('')
  const [productFormat, setProductFormat] = useState('checklist')
  const [selectedFunnel, setSelectedFunnel] = useState('')
  const [productType, setProductType] = useState('')
  const [pinterestEnabled, setPinterestEnabled] = useState(true)
  const [pinterestPinCount, setPinterestPinCount] = useState(32)
  const [manifestableRatio, setManifestableRatio] = useState(0.70)
  const [videoEnabled, setVideoEnabled] = useState(false)  // NEW: default OFF
  const [testMode, setTestMode] = useState(false)  // Test mode: 1 Etsy + 1 Pinterest
  const [slide10TemplateId, setSlide10TemplateId] = useState(null)  // Slide 10 template
  const [overlayCount, setOverlayCount] = useState(4)  // Overlay count (2-6)
  const [templates, setTemplates] = useState([])  // Available templates
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchTemplates()
    }
  }, [isOpen, user?.id])

  const fetchTemplates = async () => {
    if (!user?.id) {
      setTemplates([])
      return
    }
    try {
      setLoadingTemplates(true)
      const response = await fetch(`/.netlify/functions/etsy-empire-templates?user_id=${user.id}`)
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPdfUrl('')
      setProductTitle('')
      setTldrText('')
      setSecondaryBenefits('')
      setProductFormat('checklist')
      setSelectedFunnel('')
      setProductType('')
      setPinterestEnabled(true)
      setPinterestPinCount(32)
      setManifestableRatio(0.70)
      setVideoEnabled(false)  // NEW: reset video toggle
      setTestMode(false)  // Reset test mode
      setSlide10TemplateId(null)  // Reset template selection
      setOverlayCount(4)  // Reset overlay count
      setErrors({})
    }
  }, [isOpen])

  // Calculate estimated cost
  let etsyImageCount, etsyVideoCost, pinterestImageCount
  if (testMode) {
    // Test mode: 1 Etsy + 1 Pinterest = $0.04
    etsyImageCount = 1
    etsyVideoCost = 0
    pinterestImageCount = pinterestEnabled ? 1 : 0
  } else {
    etsyImageCount = videoEnabled ? 9 : 10
    etsyVideoCost = videoEnabled ? COST_PER_VIDEO : 0
    pinterestImageCount = pinterestEnabled ? pinterestPinCount : 0
  }
  const etsyImageCost = etsyImageCount * COST_PER_IMAGE
  const pinterestCost = pinterestImageCount * COST_PER_IMAGE
  const totalCost = etsyImageCost + etsyVideoCost + pinterestCost
  const totalImages = etsyImageCount + pinterestImageCount
  const estimatedCost = totalCost.toFixed(2)

  // Validate current step
  const validateStep = () => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!pdfUrl) newErrors.pdf = 'Please upload a PDF file'
        break
      case 2:
        if (!productTitle.trim()) newErrors.title = 'Product title is required'
        if (productTitle.length > 300) newErrors.title = 'Title must be under 300 characters'
        if (!tldrText.trim()) newErrors.tldr = 'Main benefit is required'
        break
      case 3:
        // Funnel is optional, but if selected, product type is required
        if (selectedFunnel && !productType) {
          newErrors.productType = 'Please select a product type'
        }
        break
      case 4:
        // No validation needed
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setStep(step - 1)
    setErrors({})
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return

    const data = {
      pdf_url: pdfUrl,
      product_title: productTitle.trim(),
      tldr_text: tldrText.trim(),
      secondary_benefits: secondaryBenefits
        ? secondaryBenefits.split(',').map(b => b.trim()).filter(Boolean)
        : [],
      product_format: productFormat,
      funnel_id: selectedFunnel || null,
      product_type: selectedFunnel ? productType : null,
      pinterest_enabled: pinterestEnabled,
      pinterest_pin_count: pinterestPinCount,
      manifestable_ratio: manifestableRatio,
      video_enabled: testMode ? false : videoEnabled,  // Disable video in test mode
      test_mode: testMode,  // Test mode flag
      slide10_template_id: testMode ? null : (slide10TemplateId || null),  // No template in test mode
      overlay_count: slide10TemplateId ? overlayCount : 4  // Overlay count
    }

    await onSubmit(data)
  }

  // Handle PDF upload
  const handlePdfUpload = async (file) => {
    const url = await uploadPdf(file)
    setPdfUrl(url)
    return url
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">New Generation</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isCompleted = step > s.id

              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex items-center gap-2 ${
                    isActive ? 'text-purple-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-purple-100' :
                      isCompleted ? 'bg-green-100' :
                      'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{s.id}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Upload PDF */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your PDF</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload the PDF product that you want to create Etsy and Pinterest visuals for.
                </p>
              </div>

              <PdfUploader
                onUpload={handlePdfUpload}
                uploadedUrl={pdfUrl}
                onClear={() => setPdfUrl('')}
              />

              {errors.pdf && (
                <p className="text-sm text-red-600">{errors.pdf}</p>
              )}
            </div>
          )}

          {/* Step 2: Product Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Product Details</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tell us about your product so we can create compelling visuals.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="e.g., 5 Reels That Turn 100 Views Into 10,000"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength={300}
                />
                <div className="flex justify-between mt-1">
                  {errors.title ? (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{productTitle.length}/300</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Benefit / TLDR *
                </label>
                <textarea
                  value={tldrText}
                  onChange={(e) => setTldrText(e.target.value)}
                  placeholder="The complete system for turning viral moments into paying customers..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    errors.tldr ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.tldr && (
                  <p className="text-sm text-red-600 mt-1">{errors.tldr}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Format *
                </label>
                <select
                  value={productFormat}
                  onChange={(e) => setProductFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {FORMAT_OPTIONS.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  What type of digital product is this?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Benefits (optional)
                </label>
                <input
                  type="text"
                  value={secondaryBenefits}
                  onChange={(e) => setSecondaryBenefits(e.target.value)}
                  placeholder="Step-by-step system, Copy-paste templates, Real examples"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of additional benefits
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Link to Funnel */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Link to Funnel (Optional)</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Optionally link this generation to one of your funnels for organization.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Funnel
                </label>
                <select
                  value={selectedFunnel}
                  onChange={(e) => {
                    setSelectedFunnel(e.target.value)
                    if (!e.target.value) setProductType('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">None - Standalone</option>
                  {funnels.map(funnel => (
                    <option key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFunnel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type *
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      errors.productType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select product type...</option>
                    {PRODUCT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.productType && (
                    <p className="text-sm text-red-600 mt-1">{errors.productType}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Configure Output */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configure Output</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose what type of images to generate.
                </p>
              </div>

              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className={`w-5 h-5 ${testMode ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">Test Mode</p>
                    <p className="text-sm text-gray-500">
                      Generate only 1 Etsy + 1 Pinterest image ($0.04)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTestMode(!testMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    testMode ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    testMode ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Pinterest Toggle */}
              <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${testMode ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Pin className={`w-5 h-5 ${pinterestEnabled && !testMode ? 'text-pink-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">Pinterest Pins</p>
                    <p className="text-sm text-gray-500">
                      {testMode ? '1 pin (test mode)' : `Generate ${pinterestPinCount} additional Pinterest-optimized pins`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !testMode && setPinterestEnabled(!pinterestEnabled)}
                  disabled={testMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    pinterestEnabled ? 'bg-pink-500' : 'bg-gray-300'
                  } ${testMode ? 'cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    pinterestEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Pinterest Pin Count Dropdown */}
              {pinterestEnabled && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Pins
                  </label>
                  <select
                    value={pinterestPinCount}
                    onChange={(e) => setPinterestPinCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={8}>8 pins</option>
                    <option value={16}>16 pins</option>
                    <option value={32}>32 pins</option>
                  </select>
                </div>
              )}

              {/* Video Toggle - NEW */}
              <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${testMode ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Video className={`w-5 h-5 ${videoEnabled && !testMode ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">Add Video Slide</p>
                    <p className="text-sm text-gray-500">
                      {testMode ? 'Disabled in test mode' : 'Slide 2 becomes a 6-second video (+$0.10)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !testMode && setVideoEnabled(!videoEnabled)}
                  disabled={testMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    videoEnabled && !testMode ? 'bg-purple-500' : 'bg-gray-300'
                  } ${testMode ? 'cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    videoEnabled && !testMode ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Slide 10 Template - NEW */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Image className={`w-5 h-5 ${slide10TemplateId ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">Slide 10 Template (Optional)</p>
                    <p className="text-sm text-gray-500">
                      Use your branding template with product overlays
                    </p>
                  </div>
                </div>

                <select
                  value={slide10TemplateId || ''}
                  onChange={(e) => setSlide10TemplateId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={loadingTemplates}
                >
                  <option value="">None (AI generates)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                {slide10TemplateId && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Overlay Count: {overlayCount}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="6"
                      value={overlayCount}
                      onChange={(e) => setOverlayCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>2</span>
                      <span>6</span>
                    </div>
                  </div>
                )}

                {templates.length === 0 && !loadingTemplates && (
                  <p className="text-xs text-gray-500">
                    No templates uploaded yet. Visit the Templates tab to create one.
                  </p>
                )}
              </div>

              {/* Style Ratio Slider */}
              {pinterestEnabled && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Manifestable Style Ratio</h4>
                  <StyleRatioSlider
                    value={manifestableRatio}
                    onChange={setManifestableRatio}
                  />
                </div>
              )}

              {/* Cost Estimate */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Estimated Cost</p>
                  <p className="text-sm text-gray-500">
                    {totalImages} images @ $0.02/image{videoEnabled ? ' + 1 video @ $0.10' : ''}
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">${estimatedCost}</span>
              </div>
            </div>
          )}

          {/* Step 5: Confirm & Start */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm & Start</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Review your settings and start the generation.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Product Title</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                    {productTitle}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Main Benefit</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                    {tldrText}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Format</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {productFormat}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Linked Funnel</span>
                  <span className="font-medium text-gray-900">
                    {selectedFunnel
                      ? funnels.find(f => f.id === selectedFunnel)?.name || 'Selected'
                      : '(standalone)'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Test Mode</span>
                  <span className={`font-medium ${testMode ? 'text-amber-600' : 'text-gray-400'}`}>
                    {testMode ? 'Enabled (1 Etsy + 1 Pinterest)' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Pinterest Pins</span>
                  <span className={`font-medium ${pinterestEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {testMode ? '1 (test mode)' : (pinterestEnabled ? `Enabled (${pinterestPinCount})` : 'Disabled')}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Video Slide</span>
                  <span className={`font-medium ${videoEnabled && !testMode ? 'text-purple-600' : 'text-gray-400'}`}>
                    {testMode ? 'Disabled (test mode)' : (videoEnabled ? 'Enabled' : 'Disabled')}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Slide 10 Template</span>
                  <span className={`font-medium ${slide10TemplateId ? 'text-purple-600' : 'text-gray-400'}`}>
                    {slide10TemplateId
                      ? `${templates.find(t => t.id === slide10TemplateId)?.name || 'Selected'} (${overlayCount} overlays)`
                      : 'None (AI generates)'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Images</span>
                  <span className="font-medium text-gray-900">{totalImages}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">Estimated Cost</span>
                  <span className="font-bold text-blue-600">${estimatedCost}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div>
            {step < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Start Generation
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
