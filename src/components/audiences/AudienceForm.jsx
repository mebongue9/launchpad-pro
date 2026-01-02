// /src/components/audiences/AudienceForm.jsx
// Form for creating and editing target audiences
// Simple form with name and description
// RELEVANT FILES: src/hooks/useAudiences.js, src/pages/Audiences.jsx, src/components/ui/Input.jsx

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAudiences } from '../../hooks/useAudiences'
import { useToast } from '../ui/Toast'

export function AudienceForm({ audience, onClose, onSuccess }) {
  const { createAudience, updateAudience } = useAudiences()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (audience) {
      setFormData({
        name: audience.name || '',
        description: audience.description || '',
      })
    }
  }, [audience])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (audience) {
        await updateAudience(audience.id, formData)
        addToast('Audience updated successfully', 'success')
      } else {
        await createAudience(formData)
        addToast('Audience created successfully', 'success')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      addToast(err.message || 'Failed to save audience', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Audience Name *"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Busy executives, New coaches"
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your ideal client in detail: Who are they? What are their pain points? What do they desire? What keeps them up at night? What transformation do they want?"
          required
          rows={6}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include pain points, desires, goals, and demographics. The more detail, the better the AI output.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {audience ? 'Update Audience' : 'Create Audience'}
        </Button>
      </div>
    </form>
  )
}
