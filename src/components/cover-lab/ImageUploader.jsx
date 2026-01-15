// src/components/cover-lab/ImageUploader.jsx
// Drag & drop image uploader with compression for Cover Lab
// RELEVANT FILES: src/components/cover-lab/CreativeLab.jsx, netlify/functions/analyze-cover-image.js

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'

// Compress image to max width and JPEG quality
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      // Set canvas size and draw
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', quality)
      resolve(base64)
    }

    img.onerror = () => reject(new Error('Failed to load image'))

    // Load image from file
    const reader = new FileReader()
    reader.onload = (e) => { img.src = e.target.result }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Check file size (4MB max before compression)
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

export function ImageUploader({ onImageReady, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    setError(null)
    setProcessing(true)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (PNG, JPG, etc.)')
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Image must be under 4MB')
      }

      // Compress image
      const base64 = await compressImage(file)

      // Set preview and notify parent
      setPreview(base64)
      onImageReady(base64)
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setProcessing(false)
    }
  }, [onImageReady])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
  }, [disabled, processFile])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleClear = useCallback(() => {
    setPreview(null)
    setError(null)
    onImageReady(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onImageReady])

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      {!preview ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {processing ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-600">Processing image...</p>
            </div>
          ) : (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-purple-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Drop image here' : 'Drag & drop a cover image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse (PNG, JPG, max 4MB)
              </p>
            </>
          )}
        </div>
      ) : (
        /* Preview with clear button */
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Cover preview"
            className="w-full h-auto max-h-64 object-contain bg-gray-100"
          />
          <button
            onClick={handleClear}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Upload a cover design you'd like to recreate. We'll analyze it and generate similar variations.
      </p>
    </div>
  )
}

export default ImageUploader
