// /src/components/editor/ContentEditor.jsx
// Simple text editor for editing generated content
// Uses plain textarea - lightweight, no external dependencies
// RELEVANT FILES: src/pages/FunnelDetails.jsx, src/hooks/useExistingProducts.jsx

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'

export default function ContentEditor({
  isOpen,
  onClose,
  content,
  onSave,
  title = 'Edit Content',
  saving = false
}) {
  const [editorContent, setEditorContent] = useState(content || '')

  // Update content when prop changes
  useEffect(() => {
    setEditorContent(content || '')
  }, [content])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(editorContent)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-sm leading-relaxed resize-none"
            placeholder="Enter content here..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
