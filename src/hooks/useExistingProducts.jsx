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
    if (user) {
      fetchProducts()
    }
  }, [user])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('existing_products')
        .select('*, profiles(name, business_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('existing_products')
        .insert({
          user_id: user.id,
          ...productData
        })
        .select()
        .single()

      if (error) throw error
      await fetchProducts()
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateProduct(id, updates) {
    try {
      const { error } = await supabase
        .from('existing_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchProducts()
    } catch (err) {
      throw err
    }
  }

  async function deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('existing_products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchProducts()
    } catch (err) {
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
