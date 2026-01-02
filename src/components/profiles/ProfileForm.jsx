// /src/components/profiles/ProfileForm.jsx
// Form for creating and editing profiles
// Handles file uploads for logo and photo
// RELEVANT FILES: src/hooks/useProfiles.js, src/pages/Profiles.jsx, src/components/ui/Input.jsx

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProfiles } from '../../hooks/useProfiles'
import { useToast } from '../ui/Toast'
import { Upload } from 'lucide-react'

export function ProfileForm({ profile, onClose, onSuccess }) {
  const { createProfile, updateProfile, uploadFile } = useProfiles()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    niche: '',
    avatar: '',
    income_method: '',
    tagline: '',
    vibe: '',
    social_handle: '',
    logo_url: '',
    photo_url: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        business_name: profile.business_name || '',
        niche: profile.niche || '',
        avatar: profile.avatar || '',
        income_method: profile.income_method || '',
        tagline: profile.tagline || '',
        vibe: profile.vibe || '',
        social_handle: profile.social_handle || '',
        logo_url: profile.logo_url || '',
        photo_url: profile.photo_url || '',
      })
    }
  }, [profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e, field, bucket) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      addToast('File must be smaller than 5MB', 'error')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      addToast('Please upload a JPG, PNG, or WebP image', 'error')
      return
    }

    try {
      setLoading(true)
      const url = await uploadFile(bucket, file)
      setFormData(prev => ({ ...prev, [field]: url }))
      addToast('Image uploaded successfully', 'success')
    } catch (err) {
      addToast('Failed to upload image', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (profile) {
        await updateProfile(profile.id, formData)
        addToast('Profile updated successfully', 'success')
      } else {
        await createProfile(formData)
        addToast('Profile created successfully', 'success')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      addToast(err.message || 'Failed to save profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name *"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your name"
        required
      />

      <Input
        label="Business Name"
        name="business_name"
        value={formData.business_name}
        onChange={handleChange}
        placeholder="Your business name"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Niche / What You Do *
        </label>
        <textarea
          name="niche"
          value={formData.niche}
          onChange={handleChange}
          placeholder="Describe your niche and specialty. E.g., Executive coaching for tech leaders transitioning to C-suite roles. I help ambitious professionals develop strategic leadership skills..."
          required
          rows={3}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Ideal Client Avatar *
        </label>
        <textarea
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          placeholder="Describe your ideal client in detail: Who are they? What are their goals? What are their fears and frustrations? What keeps them up at night? What transformation do they want?"
          required
          rows={4}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          The more detail you provide, the better the AI will tailor your funnels and lead magnets.
        </p>
      </div>

      <Input
        label="Income Method"
        name="income_method"
        value={formData.income_method}
        onChange={handleChange}
        placeholder="e.g., Online courses, 1:1 coaching"
      />

      <Input
        label="Tagline"
        name="tagline"
        value={formData.tagline}
        onChange={handleChange}
        placeholder="Your personal tagline or motto"
      />

      <Input
        label="Vibe/Tone"
        name="vibe"
        value={formData.vibe}
        onChange={handleChange}
        placeholder="e.g., Professional yet approachable"
      />

      <Input
        label="Social Handle"
        name="social_handle"
        value={formData.social_handle}
        onChange={handleChange}
        placeholder="@yourhandle"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Photo
          </label>
          <div className="relative">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt="Profile"
                className="w-full h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, 'photo_url', 'photos')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo
          </label>
          <div className="relative">
            {formData.logo_url ? (
              <img
                src={formData.logo_url}
                alt="Logo"
                className="w-full h-24 object-contain rounded-lg bg-gray-50"
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, 'logo_url', 'logos')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
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
          {profile ? 'Update Profile' : 'Create Profile'}
        </Button>
      </div>
    </form>
  )
}
