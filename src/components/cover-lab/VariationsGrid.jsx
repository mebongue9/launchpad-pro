// src/components/cover-lab/VariationsGrid.jsx
// 2x2 grid displaying generated cover variations with live HTML/CSS previews
// RELEVANT FILES: src/components/cover-lab/CreativeLab.jsx, netlify/functions/generate-cover-variations.js

import { useState, useRef, useEffect } from 'react'
import { Check, Save, Palette, Type, Sparkles } from 'lucide-react'

export function VariationsGrid({ variations, selectedId, onSelect, onSave }) {
  if (!variations || variations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variations generated yet
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {variations.map((variation) => (
        <VariationCard
          key={variation.id}
          variation={variation}
          isSelected={selectedId === variation.id}
          onSelect={() => onSelect(variation)}
          onSave={() => onSave(variation)}
        />
      ))}
    </div>
  )
}

function VariationCard({ variation, isSelected, onSelect, onSave }) {
  const {
    id,
    name,
    description,
    html_template,
    css_styles,
    colors = {},
    font_family,
    font_family_url,
    is_gradient
  } = variation

  const iframeRef = useRef(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Generate full HTML document for iframe
  const generatePreviewHtml = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${font_family_url ? `<link href="${font_family_url}" rel="stylesheet">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f3f4f6;
      font-family: ${font_family ? `'${font_family}', ` : ''}system-ui, sans-serif;
    }
    .cover-wrapper {
      width: 100%;
      max-width: 300px;
      aspect-ratio: 8.5 / 11;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    ${css_styles || ''}
  </style>
</head>
<body>
  <div class="cover-wrapper">
    ${html_template || '<div style="padding:20px;text-align:center;">Preview</div>'}
  </div>
</body>
</html>`
  }

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generatePreviewHtml())
        doc.close()
        setIframeLoaded(true)
      }
    }
  }, [html_template, css_styles, font_family, font_family_url])

  return (
    <div
      className={`
        relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer
        ${isSelected
          ? 'border-purple-500 ring-2 ring-purple-200'
          : 'border-gray-200 hover:border-purple-300'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Save button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSave()
        }}
        className="absolute top-2 left-2 z-10 p-1.5 bg-white rounded-lg shadow-md hover:bg-purple-50 transition-colors group"
        title="Save as template"
      >
        <Save className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
      </button>

      {/* Preview iframe */}
      <div className="bg-gray-100 aspect-[3/4] overflow-hidden">
        <iframe
          ref={iframeRef}
          title={`Preview: ${name}`}
          className="w-full h-full border-0 pointer-events-none"
          sandbox="allow-same-origin"
        />
      </div>

      {/* Info section */}
      <div className="p-3 bg-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h4 className="font-medium text-gray-900 text-sm">{name}</h4>
        </div>

        {description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{description}</p>
        )}

        {/* Meta info row */}
        <div className="flex items-center justify-between">
          {/* Color dots */}
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-gray-400" />
            {colors.primary && (
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: colors.primary }}
                title={`Primary: ${colors.primary}`}
              />
            )}
            {colors.secondary && (
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: colors.secondary }}
                title={`Secondary: ${colors.secondary}`}
              />
            )}
            {colors.tertiary && (
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: colors.tertiary }}
                title={`Tertiary: ${colors.tertiary}`}
              />
            )}
          </div>

          {/* Font */}
          {font_family && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Type className="w-3 h-3" />
              <span className="truncate max-w-24">{font_family}</span>
            </div>
          )}

          {/* Gradient badge */}
          {is_gradient && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              Gradient
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default VariationsGrid
