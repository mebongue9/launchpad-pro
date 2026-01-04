// /src/pages/VisualBuilder.jsx
// Visual Builder for creating designed PDFs and presentations
// Uses style templates to generate professional outputs
// RELEVANT FILES: src/styles/templates/index.js, src/hooks/useCreations.jsx

import { useState, useEffect, useRef } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useProfiles } from '../hooks/useProfiles'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useCreations } from '../hooks/useCreations'
import { useToast } from '../components/ui/Toast'
import { templateList, generateVisualHTML } from '../styles/templates'
import { formatTemplateList, getFormatTemplate } from '../templates/formats/index.jsx'
import { getStyleList, getStyle } from '../templates/styles/index.js'
import {
  Palette,
  Sparkles,
  Download,
  FileText,
  Eye,
  Check,
  Loader2,
  ArrowRight,
  Maximize2,
  X,
  LayoutGrid
} from 'lucide-react'

export default function VisualBuilder() {
  const { profiles } = useProfiles()
  const { funnels } = useFunnels()
  const { leadMagnets } = useLeadMagnets()
  const { saveCreation } = useCreations()
  const { addToast } = useToast()

  const [step, setStep] = useState(1)
  const [sourceType, setSourceType] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('apple-minimal')
  const [selectedFormat, setSelectedFormat] = useState('checklist')
  const [generatedHTML, setGeneratedHTML] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const previewRef = useRef(null)

  // Get available formats and styles
  const styleList = getStyleList()

  // Get content based on source type
  function getContent() {
    if (!selectedSource) return null

    if (sourceType === 'funnel') {
      const funnel = funnels.find(f => f.id === selectedSource)
      if (!funnel) return null

      const sections = []
      const levels = ['front_end', 'bump', 'upsell_1', 'upsell_2', 'upsell_3']
      const labels = { front_end: 'Front-End', bump: 'Bump', upsell_1: 'Upsell 1', upsell_2: 'Upsell 2', upsell_3: 'Upsell 3' }

      levels.forEach(level => {
        const product = funnel[level]
        if (product) {
          sections.push({
            type: labels[level],
            title: product.name,
            content: `<p><strong>$${product.price}</strong> - ${product.format}</p><p>${product.description}</p>`
          })
        }
      })

      return {
        title: funnel.name,
        subtitle: `Complete Product Funnel`,
        sections
      }
    }

    if (sourceType === 'leadmagnet') {
      const lm = leadMagnets.find(l => l.id === selectedSource)
      if (!lm) return null

      const content = lm.content || {}
      return {
        title: content.title || lm.name,
        subtitle: content.subtitle || lm.topic,
        sections: content.sections || [
          { type: lm.format, title: lm.name, content: lm.topic || '' }
        ]
      }
    }

    return null
  }

  // Get branding from profile
  function getBranding() {
    if (!selectedProfile) return {}
    const profile = profiles.find(p => p.id === selectedProfile)
    return profile || {}
  }

  async function handleGenerate() {
    const content = getContent()
    if (!content) {
      addToast('Please select content to design', 'error')
      return
    }

    setGenerating(true)
    try {
      const branding = getBranding()
      const html = generateVisualHTML(selectedTemplate, content, branding)
      setGeneratedHTML(html)
      setStep(3)
      addToast('Design generated!', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to generate design', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedHTML) return

    setSaving(true)
    try {
      const content = getContent()
      await saveCreation({
        profile_id: selectedProfile,
        name: content?.title || 'Untitled Design',
        type: sourceType === 'funnel' ? 'funnel_visual' : 'lead_magnet_visual',
        template_id: selectedTemplate,
        html_content: generatedHTML
      })
      addToast('Design saved!', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleDownloadHTML() {
    if (!generatedHTML) return
    const content = getContent()
    const blob = new Blob([generatedHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content?.title || 'design'}.html`
    a.click()
    URL.revokeObjectURL(url)
    addToast('HTML downloaded!', 'success')
  }

  async function handleDownloadPDF() {
    if (!generatedHTML) return

    addToast('Generating PDF...', 'info')

    try {
      // Load html2pdf.js from CDN
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const content = getContent()
      const container = document.createElement('div')
      container.innerHTML = generatedHTML
      container.style.width = '210mm'
      document.body.appendChild(container)

      await window.html2pdf()
        .set({
          margin: 0,
          filename: `${content?.title || 'design'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(container)
        .save()

      document.body.removeChild(container)
      addToast('PDF downloaded!', 'success')
    } catch (error) {
      addToast('PDF generation failed. Try downloading HTML instead.', 'error')
    }
  }

  function handleReset() {
    setStep(1)
    setSourceType(null)
    setSelectedSource(null)
    setSelectedFormat('checklist')
    setGeneratedHTML(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
        <p className="text-gray-500 mt-1">
          Transform your content into beautifully designed PDFs
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          1. Select Content
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          2. Format & Style
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          3. Preview & Export
        </span>
      </div>

      {/* Step 1: Select Content */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Select Content to Design</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSourceType('funnel')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                sourceType === 'funnel'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <FileText className={`w-8 h-8 mb-3 ${sourceType === 'funnel' ? 'text-purple-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Funnel Overview</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a visual overview of your funnel products
              </p>
            </button>

            <button
              onClick={() => setSourceType('leadmagnet')}
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

          {sourceType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select {sourceType === 'funnel' ? 'Funnel' : 'Lead Magnet'}
                </label>
                <select
                  value={selectedSource || ''}
                  onChange={(e) => setSelectedSource(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose...</option>
                  {sourceType === 'funnel'
                    ? funnels.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))
                    : leadMagnets.map(lm => (
                        <option key={lm.id} value={lm.id}>{lm.name}</option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branding Profile
                </label>
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
            </div>
          )}

          {selectedSource && (
            <Button onClick={() => setStep(2)}>
              Continue to Style Selection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </Card>
      )}

      {/* Step 2: Choose Format & Style */}
      {step === 2 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Choose Format & Style</h2>
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
          </div>

          {/* Format Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Document Format
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {formatTemplateList.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{format.icon}</span>
                  <p className="text-sm font-medium text-gray-900">{format.name}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Visual Style
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {templateList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === t.id
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded-lg mb-2 flex items-center justify-center"
                    style={{ background: t.preview.bg }}
                  >
                    <div
                      className="w-6 h-6 rounded"
                      style={{ background: t.preview.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.category}</p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Design
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Step 3: Preview & Export */}
      {step === 3 && generatedHTML && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview Your Design</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  ← Back
                </Button>
                <Button variant="secondary" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </div>

            <div
              ref={previewRef}
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100"
              style={{ height: '600px' }}
            >
              <iframe
                srcDoc={generatedHTML}
                title="Preview"
                className="w-full h-full"
                style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Export Options</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownloadHTML}>
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
              <Button variant="secondary" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="secondary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save to History
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Start Over
              </Button>
            </div>
          </Card>
        </>
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

      {/* Fullscreen Modal */}
      {fullscreen && generatedHTML && (
        <div className="fixed inset-0 z-50 bg-white">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          <iframe
            srcDoc={generatedHTML}
            title="Fullscreen Preview"
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  )
}
