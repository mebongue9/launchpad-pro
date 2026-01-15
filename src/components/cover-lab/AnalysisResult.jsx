// src/components/cover-lab/AnalysisResult.jsx
// Displays the AI analysis results: verdict, colors, fonts, warnings
// RELEVANT FILES: src/components/cover-lab/CreativeLab.jsx, netlify/functions/analyze-cover-image.js

import { CheckCircle, AlertTriangle, XCircle, Palette, Type, Info } from 'lucide-react'

// Verdict badge styling
const VERDICT_CONFIG = {
  doable: {
    icon: CheckCircle,
    label: 'Ready to Generate',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  partially_doable: {
    icon: AlertTriangle,
    label: 'Possible with Adjustments',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  not_doable: {
    icon: XCircle,
    label: 'Cannot Recreate',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  }
}

export function AnalysisResult({ analysis }) {
  if (!analysis) return null

  const {
    verdict,
    explanation,
    warnings = [],
    extractedColors = {},
    suggestedFonts = [],
    layoutType
  } = analysis

  const verdictConfig = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.partially_doable
  const VerdictIcon = verdictConfig.icon

  return (
    <div className="space-y-4">
      {/* Verdict Badge */}
      <div className={`flex items-center gap-3 p-4 rounded-lg ${verdictConfig.bgColor}`}>
        <VerdictIcon className={`w-6 h-6 flex-shrink-0 ${verdictConfig.iconColor}`} />
        <div>
          <p className={`font-semibold ${verdictConfig.textColor}`}>
            {verdictConfig.label}
          </p>
          {explanation && (
            <p className="text-sm text-gray-700 mt-1">{explanation}</p>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Colors */}
      {(extractedColors.primary || extractedColors.secondary || extractedColors.tertiary) && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Extracted Colors</span>
          </div>
          <div className="flex gap-3">
            {extractedColors.primary && (
              <ColorSwatch color={extractedColors.primary} label="Primary" />
            )}
            {extractedColors.secondary && (
              <ColorSwatch color={extractedColors.secondary} label="Secondary" />
            )}
            {extractedColors.tertiary && (
              <ColorSwatch color={extractedColors.tertiary} label="Tertiary" />
            )}
          </div>
        </div>
      )}

      {/* Suggested Fonts */}
      {suggestedFonts.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Suggested Fonts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedFonts.map((font, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
              >
                {font}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Layout Type */}
      {layoutType && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4" />
          <span>Detected layout: <span className="font-medium capitalize">{layoutType}</span></span>
        </div>
      )}
    </div>
  )
}

function ColorSwatch({ color, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-mono text-gray-400">{color}</span>
    </div>
  )
}

export default AnalysisResult
