// /src/components/etsy-empire/PdfUploader.jsx
// Drag & drop PDF upload component
// Uploads to Supabase storage and returns public URL
// RELEVANT FILES: src/hooks/useEtsyEmpire.js, src/components/etsy-empire/NewProjectModal.jsx

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, Check, AlertCircle } from 'lucide-react'

export function PdfUploader({ onUpload, uploadedUrl, onClear, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)
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
    if (file.type !== 'application/pdf') return 'Please upload a PDF file'
    if (file.size > 50 * 1024 * 1024) return 'File size must be under 50MB'
    return null
  }

  const handleFile = async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)
    setFileName(file.name)

    try {
      const url = await onUpload(file)
      // Success - URL is now available
    } catch (err) {
      setError(err.message || 'Failed to upload file')
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled, onUpload])

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClear = () => {
    setFileName(null)
    setError(null)
    onClear?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // If we have an uploaded URL, show success state
  if (uploadedUrl) {
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">PDF Uploaded</p>
              <p className="text-sm text-green-600 truncate max-w-xs">
                {fileName || 'File ready'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
            disabled={disabled}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Uploading state
  if (uploading) {
    return (
      <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-800">Uploading...</p>
            <p className="text-sm text-blue-600">{fileName}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDragging ? 'bg-purple-100' : 'bg-gray-100'
          }`}>
            {isDragging ? (
              <FileText className="w-6 h-6 text-purple-600" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div>
            <p className="font-medium text-gray-700">
              {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or <span className="text-purple-600">click to browse</span>
            </p>
          </div>

          <p className="text-xs text-gray-400">
            PDF files only, up to 50MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
