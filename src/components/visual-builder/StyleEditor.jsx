// src/components/visual-builder/StyleEditor.jsx
// Compact horizontal bar for cover customization
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/PreviewPanel.jsx

import { Button } from '../ui/Button'
import { Loader2, Sparkles } from 'lucide-react'

export function StyleEditor({
  title,
  setTitle,
  subtitle,
  setSubtitle,
  authorName,
  setAuthorName,
  handle,
  setHandle,
  onGenerate,
  generating = false,
  disabled = false
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-3">
        Edit the fields below and watch the cover update in real-time
      </p>

      {/* Compact horizontal form */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Title */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your Title"
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Your subtitle"
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Author Name */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
            Author Name
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name"
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Handle / Brand */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
            Handle / Brand
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Your Brand"
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Generate button - inline */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={disabled || generating || !title}
          className="px-6"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default StyleEditor
