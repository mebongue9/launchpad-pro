// src/components/visual-builder/StyleEditor.jsx
// Compact dark bar with text inputs and size sliders
// Generate button moved to PreviewPanel
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/PreviewPanel.jsx

export function StyleEditor({
  title,
  setTitle,
  titleSize,
  setTitleSize,
  subtitle,
  setSubtitle,
  subtitleSize,
  setSubtitleSize,
  authorName,
  setAuthorName,
  authorSize,
  setAuthorSize,
  handle,
  setHandle,
  handleSize,
  setHandleSize,
  disabled = false
}) {
  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3">
      {/* 4-column grid: each field has input + size slider */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 w-8">{titleSize}%</span>
            <input
              type="range"
              min="60"
              max="140"
              step="5"
              value={titleSize}
              onChange={(e) => setTitleSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              disabled={disabled}
            />
          </div>
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
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 w-8">{subtitleSize}%</span>
            <input
              type="range"
              min="60"
              max="140"
              step="5"
              value={subtitleSize}
              onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              disabled={disabled}
            />
          </div>
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
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 w-8">{authorSize}%</span>
            <input
              type="range"
              min="60"
              max="140"
              step="5"
              value={authorSize}
              onChange={(e) => setAuthorSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              disabled={disabled}
            />
          </div>
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
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 w-8">{handleSize}%</span>
            <input
              type="range"
              min="60"
              max="140"
              step="5"
              value={handleSize}
              onChange={(e) => setHandleSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleEditor
