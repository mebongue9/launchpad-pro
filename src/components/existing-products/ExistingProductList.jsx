// /src/components/existing-products/ExistingProductList.jsx
// List component displaying existing products
// Shows product name, price, format, and actions
// RELEVANT FILES: src/pages/ExistingProducts.jsx, src/hooks/useExistingProducts.jsx

import { Edit, Trash2, Package, DollarSign, Loader2 } from 'lucide-react'
import { Card } from '../ui/Card'

export function ExistingProductList({ products, loading, error, onEdit, onDelete, onCreate }) {
  if (loading) {
    return (
      <Card className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-500 mt-2">Loading products...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-600">Error loading products: {error}</p>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Existing Products Yet
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Add your existing products (courses, programs, coaching packages) to use them as
          final upsell destinations in your funnels.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Your First Product
        </button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.format || 'Product'}</p>
              </div>
            </div>
            <div className="flex items-center text-green-600 font-semibold">
              <DollarSign className="w-4 h-4" />
              {product.price}
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mb-3 truncate"
            >
              {product.url}
            </a>
          )}

          {product.profiles?.name && (
            <p className="text-xs text-gray-500 mb-3">
              Profile: {product.profiles.name}
            </p>
          )}

          <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
