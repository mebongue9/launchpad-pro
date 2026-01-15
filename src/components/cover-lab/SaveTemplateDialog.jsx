// src/components/cover-lab/SaveTemplateDialog.jsx
// Modal dialog for naming and saving a cover template
// RELEVANT FILES: src/components/cover-lab/CreativeLab.jsx, netlify/functions/save-cover-template.js

import { useState, useEffect } from 'react'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

export function SaveTemplateDialog({ isOpen, onClose, variation, onSave, saving = false }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && variation) {
      setName(variation.name || 'My Custom Cover')
      setError(null)
    }
  }, [isOpen, variation])

  if (!isOpen || !variation) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate name
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a name for your template')
      return
    }
    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less')
      return
    }

    try {
      await onSave(trimmedName, variation)
    } catch (err) {
      setError(err.message || 'Failed to save template')
    }
  }

  const { colors = {}, font_family, is_gradient } = variation

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Save Template</h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Template preview summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {/* Color preview */}
                <div className="flex gap-1">
                  {colors.primary && (
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                  {colors.secondary && (
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: colors.secondary }}
                    />
                  )}
                  {colors.tertiary && (
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: colors.tertiary }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {variation.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {font_family && <span>{font_family}</span>}
                    {is_gradient && (
                      <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        Gradient
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Name input */}
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this template"
                disabled={saving}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                {name.length}/100 characters
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !name.trim()}
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default SaveTemplateDialog
