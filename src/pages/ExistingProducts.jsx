// /src/pages/ExistingProducts.jsx
// Existing products management page with list and create/edit modal
// Products that can serve as upsell destinations in funnels
// RELEVANT FILES: src/hooks/useExistingProducts.jsx, src/components/existing-products/

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { useExistingProducts } from '../hooks/useExistingProducts'
import { ExistingProductList } from '../components/existing-products/ExistingProductList'
import { ExistingProductForm } from '../components/existing-products/ExistingProductForm'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { Card } from '../components/ui/Card'

export default function ExistingProducts() {
  const { products, loading, error, deleteProduct, fetchProducts } = useExistingProducts()
  const { addToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const handleCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await deleteProduct(id)
      addToast('Product deleted successfully', 'success')
    } catch (err) {
      addToast('Failed to delete product', 'error')
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Existing Products</h1>
          <p className="text-gray-500 mt-1">
            Your existing products that can serve as final upsell destinations
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <ExistingProductList
        products={products}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingProduct ? 'Edit Product' : 'Add Existing Product'}
      >
        <ExistingProductForm
          product={editingProduct}
          onClose={handleClose}
          onSuccess={fetchProducts}
        />
      </Modal>
    </div>
  )
}
