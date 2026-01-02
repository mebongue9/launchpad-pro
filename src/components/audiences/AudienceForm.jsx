// /src/components/audiences/AudienceForm.jsx
// Form for creating and editing target audiences
// Handles array fields for pain points and desires
// RELEVANT FILES: src/hooks/useAudiences.js, src/pages/Audiences.jsx, src/components/ui/Input.jsx

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAudiences } from '../../hooks/useAudiences'
import { useToast } from '../ui/Toast'
import { Plus, X } from 'lucide-react'

export function AudienceForm({ audience, onClose, onSuccess }) {
  const { createAudience, updateAudience } = useAudiences()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pain_points: [''],
    desires: [''],
  })

  useEffect(() => {
    if (audience) {
      setFormData({
        name: audience.name || '',
        description: audience.description || '',
        pain_points: audience.pain_points?.length ? audience.pain_points : [''],
        desires: audience.desires?.length ? audience.desires : [''],
      })
    }
  }, [audience])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    if (formData[field].length <= 1) return
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const dataToSave = {
      ...formData,
      pain_points: formData.pain_points.filter(p => p.trim()),
      desires: formData.desires.filter(d => d.trim()),
    }

    try {
      if (audience) {
        await updateAudience(audience.id, dataToSave)
        addToast('Audience updated successfully', 'success')
      } else {
        await createAudience(dataToSave)
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

      <Input
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe who this audience is..."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pain Points
        </label>
        {formData.pain_points.map((point, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={point}
              onChange={(e) => handleArrayChange('pain_points', index, e.target.value)}
              placeholder="e.g., Not enough time"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('pain_points', index)}
              className="p-2 text-gray-400 hover:text-red-600"
              disabled={formData.pain_points.length <= 1}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('pain_points')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add pain point
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Desires
        </label>
        {formData.desires.map((desire, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={desire}
              onChange={(e) => handleArrayChange('desires', index, e.target.value)}
              placeholder="e.g., More freedom"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('desires', index)}
              className="p-2 text-gray-400 hover:text-red-600"
              disabled={formData.desires.length <= 1}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('desires')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add desire
        </button>
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
