/**
 * Cart state and actions for POS (add, update, remove, helpers).
 */

import { useState, useCallback } from 'react'
import type { CartItem } from '@/types/pos'
import { areCartItemsIdentical } from '@/types/pos'

export type AddToCartPayload = {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  modifiers?: { name: string; price: number }[]
  notes?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  selectedSize?: string
  quantity?: number
}

export type ProductForCustomization = {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: { id: string; name: string; price: number }[]
  modifiers?: { id: string; name: string; price: number }[]
}

function genLineItemId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function usePOSCart(showToast: (message: string, type: 'success' | 'error' | 'info') => void) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const addToCart = useCallback((product: AddToCartPayload) => {
    const quantityToAdd = Math.max(1, Math.floor(product.quantity ?? 1))
    setAddingToCart(product.id)
    setCartItems((prev) => {
      const newItemSnapshot: CartItem = {
        id: product.id,
        lineItemId: '',
        name: product.name,
        price: product.price,
        quantity: quantityToAdd,
        category: product.category,
        image: product.image,
        modifiers: product.modifiers ?? [],
        notes: product.notes ?? undefined,
        discount: product.discount,
        discountType: product.discountType,
        selectedSize: product.selectedSize,
      }
      const existingIndex = prev.findIndex((item) => areCartItemsIdentical(item, newItemSnapshot))
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        }
        return updated
      }
      return [...prev, { ...newItemSnapshot, lineItemId: genLineItemId(), quantity: quantityToAdd }]
    })
    setAddingToCart(null)
    showToast(`${product.name} added to cart!`, 'success')
  }, [showToast])

  const requiresCustomization = useCallback((_product: ProductForCustomization) => true, [])

  const updateCartItem = useCallback((lineItemId: string, quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.lineItemId !== lineItemId))
      return
    }
    const validQuantity = Math.max(1, Math.floor(quantity))
    setCartItems((prev) =>
      prev.map((item) => (item.lineItemId === lineItemId ? { ...item, quantity: validQuantity } : item))
    )
  }, [])

  const updateCartItemFull = useCallback((
    lineItemId: string,
    updates: { quantity: number; discount?: number; discountType?: 'percentage' | 'fixed'; notes?: string }
  ) => {
    const { quantity, discount, notes } = updates
    if (isNaN(quantity) || quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.lineItemId !== lineItemId))
      return
    }
    const validQuantity = Math.max(1, Math.floor(quantity))
    let validDiscount = discount
    if (discount !== undefined) {
      validDiscount = isNaN(discount) || discount < 0 ? 0 : Math.min(100, discount)
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.lineItemId !== lineItemId) return item
        return {
          ...item,
          quantity: validQuantity,
          ...(validDiscount !== undefined && { discount: validDiscount }),
          discountType: 'percentage',
          ...(notes !== undefined && { notes }),
        }
      })
    )
  }, [])

  const updateCartItemCustomization = useCallback((
    lineItemId: string,
    payload: AddToCartPayload
  ) => {
    const quantity = Math.max(1, Math.floor(payload.quantity ?? 1))
    const discount = payload.discount != null
      ? Math.max(0, Math.min(100, payload.discount))
      : undefined
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.lineItemId !== lineItemId) return item
        return {
          ...item,
          price: payload.price,
          selectedSize: payload.selectedSize ?? undefined,
          modifiers: payload.modifiers ?? [],
          notes: (payload.notes ?? '').trim() || undefined,
          quantity,
          discount,
          discountType: (payload.discountType ?? 'percentage') as 'percentage' | 'fixed',
        }
      })
    )
  }, [])

  const removeFromCart = useCallback((lineItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.lineItemId !== lineItemId))
  }, [])

  const decrementProductInCart = useCallback((productId: string) => {
    setCartItems((prev) => {
      const idx = prev.map((item) => item.id).lastIndexOf(productId)
      if (idx < 0) return prev
      const item = prev[idx]
      if (item.quantity <= 1) {
        return prev.filter((i) => i.lineItemId !== item.lineItemId)
      }
      const updated = [...prev]
      updated[idx] = { ...item, quantity: item.quantity - 1 }
      return updated
    })
  }, [])

  const clearCartItems = useCallback(() => {
    setCartItems([])
  }, [])

  const getLastCartItemForProductCurrent = useCallback((productId: string): CartItem | undefined => {
    const matches = cartItems.filter((item) => item.id === productId)
    return matches.length > 0 ? matches[matches.length - 1] : undefined
  }, [cartItems])

  const getCartSummaryByProductIdCurrent = useCallback((productId: string) => {
    const items = cartItems.filter((item) => item.id === productId)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const lastItem = items.length > 0 ? items[items.length - 1] : undefined
    return { totalQuantity, lastItem }
  }, [cartItems])

  return {
    cartItems,
    setCartItems,
    addingToCart,
    addToCart,
    updateCartItem,
    updateCartItemFull,
    updateCartItemCustomization,
    removeFromCart,
    decrementProductInCart,
    getLastCartItemForProduct: getLastCartItemForProductCurrent,
    getCartSummaryByProductId: getCartSummaryByProductIdCurrent,
    requiresCustomization,
    clearCartItems,
    genLineItemId,
  }
}
