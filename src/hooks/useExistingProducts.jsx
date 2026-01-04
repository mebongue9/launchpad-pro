// /src/hooks/useExistingProducts.jsx
// Hook for existing products CRUD operations
// Manages user's existing products that can be upsell destinations
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, src/components/existing-products/

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useExistingProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🚀 [EXISTING-PRODUCTS] Hook initialized, user:', user?.id || 'none')
    if (user) {
      fetchProducts()
    }
  }, [user])

  async function fetchProducts() {
    if (!user) {
      console.log('🔄 [EXISTING-PRODUCTS] Skipping fetch - no user authenticated')
      return
    }

    try {
      console.log('🔄 [EXISTING-PRODUCTS] Fetching products for user:', user.id)
      setLoading(true)
      const { data, error } = await supabase
        .from('existing_products')
        .select('*, profiles(name, business_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [EXISTING-PRODUCTS] Fetch error:', error.message)
        throw error
      }
      console.log('✅ [EXISTING-PRODUCTS] Fetched', data?.length || 0, 'products')
      setProducts(data || [])
    } catch (err) {
      console.error('❌ [EXISTING-PRODUCTS] Fetch exception:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createProduct(productData) {
    console.log('📥 [EXISTING-PRODUCTS] Creating product:', productData.name)
    try {
      const { data, error } = await supabase
        .from('existing_products')
        .insert({
          user_id: user.id,
          ...productData
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [EXISTING-PRODUCTS] Create error:', error.message)
        throw error
      }
      console.log('✅ [EXISTING-PRODUCTS] Created product:', data.id)
      await fetchProducts()
      return data
    } catch (err) {
      console.error('❌ [EXISTING-PRODUCTS] Create exception:', err.message)
      throw err
    }
  }

  async function updateProduct(id, updates) {
    console.log('🔄 [EXISTING-PRODUCTS] Updating product:', id)
    try {
      const { error } = await supabase
        .from('existing_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ [EXISTING-PRODUCTS] Update error:', error.message)
        throw error
      }
      console.log('✅ [EXISTING-PRODUCTS] Updated product:', id)
      await fetchProducts()
    } catch (err) {
      console.error('❌ [EXISTING-PRODUCTS] Update exception:', err.message)
      throw err
    }
  }

  async function deleteProduct(id) {
    console.log('🔄 [EXISTING-PRODUCTS] Deleting product:', id)
    try {
      const { error } = await supabase
        .from('existing_products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ [EXISTING-PRODUCTS] Delete error:', error.message)
        throw error
      }
      console.log('✅ [EXISTING-PRODUCTS] Deleted product:', id)
      await fetchProducts()
    } catch (err) {
      console.error('❌ [EXISTING-PRODUCTS] Delete exception:', err.message)
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  }
}
