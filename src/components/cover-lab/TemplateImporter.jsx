// src/components/cover-lab/TemplateImporter.jsx
// Import cover templates from HTML files created in Claude Project
// Extracts CSS variables, shows preview, saves to database
// RELEVANT FILES: CreativeLab.jsx, useCoverTemplates.js, save-cover-template.js

import { useState, useCallback, useRef } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../ui/Toast'
import { useCoverTemplates } from '../../hooks/useCoverTemplates'
import {
  Upload,
  FileCode,
  X,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Eye
} from 'lucide-react'

// Required CSS variables that must be present in the HTML
const REQUIRED_CSS_VARS = [
  'primary-color',
  'primary-light',
  'primary-dark',
  'header-gradient',
  'light-bg',
  'text-color',
  'text-muted',
  'background'
]

// Display labels for CSS variables
const CSS_VAR_LABELS = {
  'primary-color': 'Primary',
  'primary-light': 'Light',
  'primary-dark': 'Dark',
  'header-gradient': 'Gradient',
  'light-bg': 'Light BG',
  'text-color': 'Text',
  'text-muted': 'Muted',
  'background': 'Background'
}

/**
 * Extract all 8 CSS variables from HTML :root block
 */
function extractColorPalette(htmlContent) {
  // Find :root block
  const rootMatch = htmlContent.match(/:root\s*\{([^}]+)\}/s)
  if (!rootMatch) {
    throw new Error('No :root CSS block found in HTML file')
  }

  const rootContent = rootMatch[1]
  const palette = {}
  const missing = []

  for (const varName of REQUIRED_CSS_VARS) {
    // Match CSS variable value (handles colors, gradients, rgba, etc.)
    const regex = new RegExp(`--${varName}\\s*:\\s*([^;]+);`, 's')
    const match = rootContent.match(regex)

    if (match) {
      // Convert kebab-case to snake_case for storage key
      const key = varName.replace(/-/g, '_')
      palette[key] = match[1].trim()
    } else {
      missing.push(`--${varName}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required CSS variables: ${missing.join(', ')}`)
  }

  return palette
}

/**
 * Extract CSS styles from HTML <style> block
 */
function extractCssStyles(htmlContent) {
  const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (!styleMatch) {
    throw new Error('No <style> block found in HTML file')
  }
  return styleMatch[1].trim()
}

/**
 * Extract HTML body content (the cover markup)
 */
function extractHtmlTemplate(htmlContent) {
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) {
    throw new Error('No <body> block found in HTML file')
  }
  return bodyMatch[1].trim()
}

/**
 * Extract font family from CSS
 */
function extractFontFamily(cssContent) {
  // Look for font-family declarations
  const fontMatch = cssContent.match(/font-family:\s*['"]?([^'",;]+)['"]?/i)
  return fontMatch ? fontMatch[1].trim() : 'Inter'
}

/**
 * Extract Google Fonts URL if present
 */
function extractFontUrl(htmlContent) {
  const linkMatch = htmlContent.match(/<link[^>]*href=["']([^"']*fonts\.googleapis\.com[^"']*)["'][^>]*>/i)
  return linkMatch ? linkMatch[1] : null
}

/**
 * Check if a value is a valid hex color
 */
function isHexColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function TemplateImporter() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { refetch: refetchTemplates } = useCoverTemplates()
  const fileInputRef = useRef(null)

  // State
  const [templateName, setTemplateName] = useState('')
  const [htmlContent, setHtmlContent] = useState(null)
  const [fileName, setFileName] = useState('')
  const [palette, setPalette] = useState(null)
  const [cssStyles, setCssStyles] = useState(null)
  const [htmlTemplate, setHtmlTemplate] = useState(null)
  const [fontFamily, setFontFamily] = useState(null)
  const [fontUrl, setFontUrl] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setParseError('Please select an HTML file (.html or .htm)')
      return
    }

    setFileName(file.name)
    setParseError(null)
    setPalette(null)
    setCssStyles(null)
    setHtmlTemplate(null)
    setShowPreview(false)

    // Generate default name from filename
    const defaultName = file.name
      .replace(/^cover-/i, '')
      .replace(/\.html?$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    if (!templateName) {
      setTemplateName(defaultName)
    }

    // Read file content
    const reader = new FileReader()
    reader.onload = (event) => {
      setHtmlContent(event.target.result)
    }
    reader.onerror = () => {
      setParseError('Failed to read file')
    }
    reader.readAsText(file)
  }, [templateName])

  // Parse the HTML file
  const handleParse = useCallback(() => {
    if (!htmlContent) return

    setParseError(null)

    try {
      // Extract all components
      const extractedPalette = extractColorPalette(htmlContent)
      const extractedCss = extractCssStyles(htmlContent)
      const extractedHtml = extractHtmlTemplate(htmlContent)
      const extractedFont = extractFontFamily(extractedCss)
      const extractedFontUrl = extractFontUrl(htmlContent)

      setPalette(extractedPalette)
      setCssStyles(extractedCss)
      setHtmlTemplate(extractedHtml)
      setFontFamily(extractedFont)
      setFontUrl(extractedFontUrl)
      setShowPreview(true)

    } catch (err) {
      setParseError(err.message)
      setPalette(null)
      setCssStyles(null)
      setHtmlTemplate(null)
      setShowPreview(false)
    }
  }, [htmlContent])

  // Save template to database
  const handleSave = useCallback(async () => {
    if (!user?.id || !palette || !htmlTemplate || !cssStyles) return

    const trimmedName = templateName.trim()
    if (!trimmedName) {
      setParseError('Please enter a template name')
      return
    }

    if (trimmedName.length > 100) {
      setParseError('Template name must be 100 characters or less')
      return
    }

    setSaving(true)
    setParseError(null)

    try {
      // Map CSS variables to database columns:
      // --primary-color → primary_color
      // --primary-dark → secondary_color (used as gradient start)
      // --primary-light → tertiary_color (used as gradient end)
      const response = await fetch('/.netlify/functions/save-cover-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: trimmedName,
          variation: {
            html_template: htmlTemplate,
            css_styles: cssStyles,
            colors: {
              primary: palette.primary_color,
              secondary: palette.primary_dark,
              tertiary: palette.primary_light
            },
            font_family: fontFamily || 'Inter',
            font_family_url: fontUrl,
            is_gradient: true,
            description: `Imported from ${fileName}`
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      addToast('Template imported successfully! You can now use it in PDF Generator.', 'success')

      // Refresh templates list
      refetchTemplates()

      // Reset form
      setTemplateName('')
      setHtmlContent(null)
      setFileName('')
      setPalette(null)
      setCssStyles(null)
      setHtmlTemplate(null)
      setFontFamily(null)
      setFontUrl(null)
      setShowPreview(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      console.error('Save error:', err)
      setParseError(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }, [user?.id, templateName, palette, htmlTemplate, cssStyles, fontFamily, fontUrl, fileName, addToast, refetchTemplates])

  // Reset form
  const handleReset = useCallback(() => {
    setTemplateName('')
    setHtmlContent(null)
    setFileName('')
    setPalette(null)
    setCssStyles(null)
    setHtmlTemplate(null)
    setFontFamily(null)
    setFontUrl(null)
    setParseError(null)
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Render color swatch
  const renderColorSwatch = (varName, value) => {
    const label = CSS_VAR_LABELS[varName] || varName
    const isHex = isHexColor(value)
    const isGradient = value.includes('gradient')
    const isRgba = value.includes('rgba')

    return (
      <div key={varName} className="flex items-center gap-2 py-1.5">
        <div
          className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
          style={{
            background: value,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500 truncate font-mono" title={value}>
            {isGradient ? 'linear-gradient(...)' : value}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            Import Cover Template
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Import a cover HTML file created in Claude Project
          </p>
        </div>
        {(htmlContent || showPreview) && (
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Step 1: Name and File Upload */}
      {!showPreview && (
        <div className="space-y-4">
          {/* Template Name Input */}
          <div>
            <label htmlFor="import-template-name" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              id="import-template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Bold Orange Gradient"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {templateName.length}/100 characters
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover HTML File
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileSelect}
                className="hidden"
                id="html-file-input"
              />
              <label
                htmlFor="html-file-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {fileName ? (
                  <>
                    <FileCode className="w-6 h-6 text-blue-600" />
                    <span className="text-sm text-gray-700">{fileName}</span>
                    <Check className="w-4 h-4 text-green-600" />
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Click to select cover HTML file
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Parse Button */}
          {htmlContent && (
            <Button onClick={handleParse} className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Parse & Preview
            </Button>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {showPreview && palette && (
        <div className="space-y-4">
          {/* Template Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{templateName || 'Unnamed Template'}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{fontFamily}</span>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                Gradient
              </span>
            </div>
          </div>

          {/* Cover Preview */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Cover Preview</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
              <div
                className="relative mx-auto"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  aspectRatio: '210 / 297'
                }}
              >
                <iframe
                  srcDoc={htmlContent}
                  title="Cover Preview"
                  className="w-full h-full border-0"
                  style={{
                    transform: 'scale(0.4)',
                    transformOrigin: 'top left',
                    width: '250%',
                    height: '250%'
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>

          {/* Extracted Colors - All 8 */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Extracted Colors (8 variables)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 bg-gray-50 rounded-lg">
              {REQUIRED_CSS_VARS.map(varName => {
                const key = varName.replace(/-/g, '_')
                return renderColorSwatch(varName, palette[key])
              })}
            </div>
          </div>

          {/* Database Mapping Info */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-700 mb-1">Storage Mapping:</p>
            <ul className="space-y-0.5">
              <li><code>--primary-color</code> → <code>primary_color</code></li>
              <li><code>--primary-dark</code> → <code>secondary_color</code></li>
              <li><code>--primary-light</code> → <code>tertiary_color</code></li>
            </ul>
            <p className="mt-1 text-gray-500">Other colors are derived by interior-renderer.js</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(false)}
              disabled={saving}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {parseError && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}
    </Card>
  )
}

export default TemplateImporter
