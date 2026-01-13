// src/components/visual-builder/TemplateSelector.jsx
// Grid of cover template cards for Visual Builder
// Shows 4 default templates with color preview, name, and selection state
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/hooks/useCoverTemplates.js

import { Check } from 'lucide-react'

export function TemplateSelector({ templates, selectedId, onSelect }) {
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No templates available
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedId === template.id}
          onSelect={() => onSelect(template)}
        />
      ))}
    </div>
  )
}

function TemplateCard({ template, isSelected, onSelect }) {
  const { name, primary_color, secondary_color, tertiary_color, is_gradient, is_default } = template

  // Generate preview background based on template style
  const getPreviewBackground = () => {
    if (is_gradient) {
      return `linear-gradient(165deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    }
    // Dark backgrounds use primary as accent
    if (primary_color === '#C9A962' || primary_color === '#00FF88') {
      return '#0d0d0d'
    }
    // Light backgrounds
    if (primary_color === '#000000') {
      return '#ffffff'
    }
    return primary_color
  }

  // Get accent color for preview element
  const getAccentColor = () => {
    if (primary_color === '#000000') {
      return secondary_color // Red accent for Minimal Swiss
    }
    return primary_color
  }

  return (
    <button
      onClick={onSelect}
      className={`
        relative p-4 border-2 rounded-lg text-left transition-all
        ${isSelected
          ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50'
          : 'border-gray-200 hover:border-purple-300 bg-white'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Preview area */}
      <div
        className="w-full aspect-[3/4] rounded-lg mb-3 flex items-center justify-center overflow-hidden"
        style={{ background: getPreviewBackground() }}
      >
        {/* Accent element */}
        <div
          className="w-8 h-8 rounded"
          style={{
            background: getAccentColor(),
            boxShadow: primary_color === '#00FF88' ? `0 0 20px ${primary_color}` : 'none'
          }}
        />
      </div>

      {/* Template name */}
      <p className="text-sm font-medium text-gray-900 mb-2">{name}</p>

      {/* Color dots */}
      <div className="flex gap-1.5">
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ background: primary_color }}
          title="Primary"
        />
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ background: secondary_color }}
          title="Secondary"
        />
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ background: tertiary_color }}
          title="Tertiary"
        />
      </div>

      {/* Badge */}
      {is_default && (
        <span className="absolute bottom-2 right-2 text-xs text-gray-400">
          Default
        </span>
      )}
    </button>
  )
}

export default TemplateSelector
