// /src/components/existing-products/ExistingProductForm.jsx
// Form for creating and editing existing products
// Used in modals on the ExistingProducts page
// RELEVANT FILES: src/pages/ExistingProducts.jsx, src/hooks/useExistingProducts.jsx

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useExistingProducts } from '../../hooks/useExistingProducts'
import { useProfiles } from '../../hooks/useProfiles'
import { useToast } from '../ui/Toast'

const PRODUCT_FORMATS = [
  'Online Course',
  'Group Coaching',
  '1:1 Coaching',
  'Membership',
  'Workshop',
  'Mastermind',
  'Digital Product',
  'Consulting',
  'Other'
]

export function ExistingProductForm({ product, onClose, onSuccess }) {
  const { createProduct, updateProduct } = useExistingProducts()
  const { profiles } = useProfiles()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    format: '',
    url: '',
    profile_id: ''
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        format: product.format || '',
        url: product.url || '',
        profile_id: product.profile_id || ''
      })
    }
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      profile_id: formData.profile_id || null
    }

    try {
      if (product) {
        await updateProduct(product.id, submitData)
        showToast('Product updated successfully', 'success')
      } else {
        await createProduct(submitData)
        showToast('Product added successfully', 'success')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name *"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Authority Accelerator Program"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the product"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price ($) *"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          placeholder="997"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            name="format"
            value={formData.format}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select format...</option>
            {PRODUCT_FORMATS.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Product URL"
        name="url"
        type="url"
        value={formData.url}
        onChange={handleChange}
        placeholder="https://yoursite.com/product"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Associated Profile
        </label>
        <select
          name="profile_id"
          value={formData.profile_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select profile (optional)...</option>
          {profiles.map(profile => (
            <option key={profile.id} value={profile.id}>
              {profile.name} {profile.business_name && `(${profile.business_name})`}
            </option>
          ))}
        </select>
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
          {product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}
