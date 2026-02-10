// /src/components/etsy-empire/TemplatesTab.jsx
// Template management UI for Slide 10 branding templates
// RELEVANT FILES: netlify/functions/etsy-empire-templates.js, NewProjectModal.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload,
  Image,
  Trash2,
  X,
  Loader2,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

export function TemplatesTab() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch templates on mount
  useEffect(() => {
    if (user?.id) {
      fetchTemplates()
    }
  }, [user?.id])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/.netlify/functions/etsy-empire-templates?user_id=${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (template) => {
    setDeleteConfirm(template)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setDeleting(true)
      const response = await fetch(
        `/.netlify/functions/etsy-empire-templates?id=${deleteConfirm.id}&user_id=${user.id}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template')
      }

      // Remove from local state
      setTemplates(templates.filter(t => t.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleUploadSuccess = (newTemplate) => {
    setTemplates([newTemplate, ...templates])
    setShowUploadModal(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Branding Templates</h2>
          <p className="text-sm text-gray-500">
            Upload templates to use for Slide 10 product overlays
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Template
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty state */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Upload a branding image with your photo, tagline, and CTA to use as a template for Slide 10.
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Your First Template
          </Button>
        </div>
      )}

      {/* Template grid */}
      {templates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/5] bg-gray-100">
                <img
                  src={template.public_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-medium text-gray-900 truncate">{template.name}</p>
                <p className="text-xs text-gray-500">
                  {template.width} x {template.height}
                </p>
              </div>

              {/* Delete button (shows on hover) */}
              <button
                onClick={() => handleDeleteClick(template)}
                className="absolute top-2 right-2 p-2 bg-white/90 text-gray-600 hover:text-red-600 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadTemplateModal
          userId={user?.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Upload Modal Component
function UploadTemplateModal({ userId, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) return 'Please upload a PNG or JPG image'
    if (file.size > 10 * 1024 * 1024) return 'File size must be under 10MB'
    return null
  }

  const handleFile = (selectedFile) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setFile(selectedFile)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a template name')
      return
    }
    if (!file) {
      setError('Please select an image')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('name', name.trim())
      formData.append('file', file)

      const response = await fetch('/.netlify/functions/etsy-empire-templates', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload template')
      }

      onSuccess(data.template)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Template</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Brand Template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={uploading}
            />
          </div>

          {/* Image upload / preview */}
          {preview ? (
            <div className="relative">
              <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-2 bg-white/90 text-gray-600 hover:text-red-600 rounded-full shadow-sm"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDragging ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>

                <div>
                  <p className="font-medium text-gray-700">
                    {isDragging ? 'Drop your image here' : 'Drag & drop your template image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or <span className="text-purple-600">click to browse</span>
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  PNG or JPG, up to 10MB
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">Template Tips:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>Include your branding (photo, logo, tagline)</li>
              <li>Leave empty space around the figure for product overlays</li>
              <li>Use 4:5 aspect ratio for best results</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !name.trim() || !file}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Upload Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
