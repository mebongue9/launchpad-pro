// src/components/cover-lab/CreativeLab.jsx
// Main orchestrator component for Cover Lab with background task polling
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/hooks/useCoverTemplates.js
// BACKEND: start-cover-generation.js, process-cover-generation-background.js, check-cover-generation.js

import { useState, useCallback, useRef } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../ui/Toast'
import { useCoverTemplates } from '../../hooks/useCoverTemplates'
import { ImageUploader } from './ImageUploader'
import { AnalysisResult } from './AnalysisResult'
import { VariationsGrid } from './VariationsGrid'
import { SaveTemplateDialog } from './SaveTemplateDialog'
import {
  Loader2,
  Wand2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react'

// State machine states
const STATES = {
  IDLE: 'idle',           // Waiting for image upload
  ANALYZING: 'analyzing', // Analyzing uploaded image
  ANALYZED: 'analyzed',   // Analysis complete, waiting to generate
  GENERATING: 'generating', // Generating variations (polling)
  GENERATED: 'generated'  // Variations ready
}

export function CreativeLab() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { refetch: refetchTemplates } = useCoverTemplates()

  // State machine
  const [state, setState] = useState(STATES.IDLE)

  // Data
  const [imageBase64, setImageBase64] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [variations, setVariations] = useState([])
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [error, setError] = useState(null)

  // Polling state
  const [progressMessage, setProgressMessage] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const pollingRef = useRef(null)

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [variationToSave, setVariationToSave] = useState(null)
  const [saving, setSaving] = useState(false)

  // Handle image ready from uploader
  const handleImageReady = useCallback((base64) => {
    setImageBase64(base64)
    setAnalysis(null)
    setVariations([])
    setSelectedVariation(null)
    setError(null)
    setProgressMessage('')
    setElapsedTime(0)

    if (!base64) {
      setState(STATES.IDLE)
    }
  }, [])

  // Analyze the uploaded image
  const handleAnalyze = useCallback(async () => {
    if (!imageBase64 || !user?.id) return

    setState(STATES.ANALYZING)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/analyze-cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      setAnalysis(data)
      setState(STATES.ANALYZED)

      // Show feedback based on verdict
      if (data.verdict === 'doable') {
        addToast('Image analyzed! Ready to generate variations.', 'success')
      } else if (data.verdict === 'partially_doable') {
        addToast('Image analyzed with some limitations.', 'info')
      } else {
        addToast('This design may be difficult to recreate.', 'warning')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message)
      setState(STATES.IDLE)
      addToast(err.message || 'Analysis failed', 'error')
    }
  }, [imageBase64, user?.id, addToast])

  // Poll for job result
  const pollForResult = useCallback(async (jobId, maxAttempts = 60, intervalMs = 3000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/.netlify/functions/check-cover-generation?jobId=${jobId}`)
        const result = await response.json()

        if (result.status === 'completed') {
          return result
        }

        if (result.status === 'failed') {
          return result
        }

        // Update UI with progress message
        setProgressMessage(result.message || 'Generating...')
        if (result.elapsed) {
          setElapsedTime(result.elapsed)
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      } catch (err) {
        console.error('Polling error:', err)
        // Continue polling on network errors
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    throw new Error('Generation timed out after 3 minutes')
  }, [])

  // Generate variations using background task + polling
  const handleGenerate = useCallback(async () => {
    if (!analysis || !user?.id) return

    setState(STATES.GENERATING)
    setError(null)
    setVariations([])
    setProgressMessage('Starting generation...')
    setElapsedTime(0)

    try {
      // Step 1: Create the job record
      const startResponse = await fetch('/.netlify/functions/start-cover-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult: analysis })
      })

      const startData = await startResponse.json()

      if (!startResponse.ok) {
        throw new Error(startData.error || 'Failed to start generation')
      }

      const { jobId } = startData
      console.log('Generation job created:', jobId)
      setProgressMessage('Job queued, starting background process...')

      // Step 2: Trigger the background function directly from frontend
      // This returns immediately due to -background suffix, but continues processing
      fetch('/.netlify/functions/process-cover-generation-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(() => {}) // Fire and forget - background function returns immediately

      setProgressMessage('Processing...')

      // Step 3: Poll for results
      const result = await pollForResult(jobId)

      if (result.status === 'completed') {
        if (!result.variations || result.variations.length === 0) {
          throw new Error('No variations were generated')
        }
        setVariations(result.variations)
        setState(STATES.GENERATED)
        addToast(`Generated ${result.variations.length} variations!`, 'success')
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed')
      }

    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message)
      setState(STATES.ANALYZED)
      setProgressMessage('')
      addToast(err.message || 'Generation failed', 'error')
    }
  }, [analysis, user?.id, addToast, pollForResult])

  // Open save dialog
  const handleSaveClick = useCallback((variation) => {
    setVariationToSave(variation)
    setSaveDialogOpen(true)
  }, [])

  // Save template
  const handleSaveTemplate = useCallback(async (name, variation) => {
    if (!user?.id || !variation) return

    setSaving(true)

    try {
      const response = await fetch('/.netlify/functions/save-cover-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          variation: {
            html_template: variation.html_template,
            css_styles: variation.css_styles,
            colors: variation.colors,
            font_family: variation.font_family,
            font_family_url: variation.font_family_url,
            is_gradient: variation.is_gradient
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      addToast('Template saved! You can now use it in PDF Generator.', 'success')
      setSaveDialogOpen(false)
      setVariationToSave(null)

      // Refresh templates list
      refetchTemplates()
    } catch (err) {
      console.error('Save error:', err)
      throw err // Re-throw to show in dialog
    } finally {
      setSaving(false)
    }
  }, [user?.id, addToast, refetchTemplates])

  // Reset everything
  const handleReset = useCallback(() => {
    // Clear any polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setImageBase64(null)
    setAnalysis(null)
    setVariations([])
    setSelectedVariation(null)
    setError(null)
    setProgressMessage('')
    setElapsedTime(0)
    setState(STATES.IDLE)
  }, [])

  // Check if we can proceed based on analysis verdict
  const canGenerate = analysis && analysis.verdict !== 'not_doable'

  // Format elapsed time
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Cover Lab
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload a cover design and we'll generate HTML/CSS variations you can use.
          </p>
        </div>

        {state !== STATES.IDLE && (
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Start Over
          </Button>
        )}
      </div>

      {/* Step 1: Upload Image */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Step 1: Upload Cover Image
        </h3>
        <ImageUploader
          onImageReady={handleImageReady}
          disabled={state === STATES.ANALYZING || state === STATES.GENERATING}
        />

        {/* Analyze button */}
        {imageBase64 && state === STATES.IDLE && (
          <div className="mt-4">
            <Button onClick={handleAnalyze}>
              <Wand2 className="w-4 h-4 mr-2" />
              Analyze Design
            </Button>
          </div>
        )}

        {/* Analyzing state */}
        {state === STATES.ANALYZING && (
          <div className="mt-4 flex items-center gap-3 text-purple-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Analyzing your cover design...</span>
          </div>
        )}
      </Card>

      {/* Step 2: Analysis Results */}
      {(state === STATES.ANALYZED || state === STATES.GENERATING || state === STATES.GENERATED) && analysis && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Step 2: Analysis Results
          </h3>
          <AnalysisResult analysis={analysis} />

          {/* Generate button */}
          {state === STATES.ANALYZED && canGenerate && (
            <div className="mt-4">
              <Button onClick={handleGenerate}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Variations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Cannot generate warning */}
          {state === STATES.ANALYZED && !canGenerate && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>This design cannot be recreated. Please try a different image.</span>
            </div>
          )}

          {/* Generating state with progress */}
          {state === STATES.GENERATING && (
            <div className="mt-4 py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                {progressMessage || 'Generating cover variations...'}
              </p>
              {elapsedTime > 0 && (
                <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  Elapsed: {formatTime(elapsedTime)}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-3">
                This may take up to 2 minutes. You can wait or come back later.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Variations */}
      {state === STATES.GENERATED && variations.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Step 3: Choose a Variation
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Click on a variation to select it. Use the save icon to add it to your templates.
          </p>
          <VariationsGrid
            variations={variations}
            selectedId={selectedVariation?.id}
            onSelect={setSelectedVariation}
            onSave={handleSaveClick}
          />
        </Card>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={saveDialogOpen}
        onClose={() => {
          setSaveDialogOpen(false)
          setVariationToSave(null)
        }}
        variation={variationToSave}
        onSave={handleSaveTemplate}
        saving={saving}
      />
    </div>
  )
}

export default CreativeLab
