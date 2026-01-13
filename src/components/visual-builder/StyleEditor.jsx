// src/components/visual-builder/StyleEditor.jsx
// Edit controls for title, subtitle, and size adjustments
// Includes Generate PDF button
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/PreviewPanel.jsx

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Loader2, Download, Sparkles } from 'lucide-react'

export function StyleEditor({
  title,
  setTitle,
  subtitle,
  setSubtitle,
  titleSize,
  setTitleSize,
  subtitleSize,
  setSubtitleSize,
  onGenerate,
  generating = false,
  disabled = false
}) {
  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Cover Title
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your title"
          disabled={disabled}
        />
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-500 w-20">Size: {titleSize}%</label>
          <input
            type="range"
            min="80"
            max="120"
            step="5"
            value={titleSize}
            onChange={(e) => setTitleSize(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Subtitle Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Cover Subtitle
        </label>
        <Input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Enter your subtitle (optional)"
          disabled={disabled}
        />
        <div className="flex items-center gap-4">
          <label className="text-xs text-gray-500 w-20">Size: {subtitleSize}%</label>
          <input
            type="range"
            min="80"
            max="120"
            step="5"
            value={subtitleSize}
            onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={onGenerate}
          disabled={disabled || generating || !title}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
        {!title && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Enter a title to generate
          </p>
        )}
      </div>
    </div>
  )
}

export default StyleEditor
