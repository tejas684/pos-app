'use client'

import { useState, useEffect, useMemo } from 'react'

interface ProductSize {
  id: string
  name: string
  price: number
  color?: string
}

interface Modifier {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: ProductSize[]
  modifiers?: Modifier[]
}

interface CartItem {
  id: string
  lineItemId: string
  name: string
  price: number
  quantity: number
  category?: string
  image?: string
  modifiers?: { name: string; price: number }[]
  notes?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  selectedSize?: string
}

interface ProductOptionsModalProps {
  isOpen: boolean
  product: Product | null
  editingCartItem?: CartItem | null
  onClose: () => void
  onAddToCart: (item: {
    id: string
    name: string
    price: number
    quantity: number
    category?: string
    image?: string
    modifiers?: { name: string; price: number }[]
    notes?: string
    discount?: number
    discountType?: 'percentage' | 'fixed'
    selectedSize?: string
  }) => void
}

export default function ProductOptionsModal({
  isOpen,
  product,
  editingCartItem,
  onClose,
  onAddToCart,
}: ProductOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [priceInput, setPriceInput] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [notes, setNotes] = useState('')

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      if (editingCartItem) {
        setQuantity(editingCartItem.quantity)
        setPriceInput(editingCartItem.price.toFixed(2))
        setDiscountInput(editingCartItem.discount ? `${editingCartItem.discount}%` : '')
        setNotes(editingCartItem.notes || '')
      } else {
        setQuantity(1)
        setPriceInput((product.price || 0).toFixed(2))
        setDiscountInput('')
        setNotes('')
      }
    }
  }, [isOpen, product?.id, product?.price, editingCartItem])

  // Editable unit price: use priceInput if valid, else fallback to product price
  const unitPrice = useMemo(() => {
    const parsed = parseFloat(priceInput)
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed
    return product?.price ?? 0
  }, [priceInput, product?.price])
  const fullUnitPrice = unitPrice

  // Parse discount input — percentage only (0–100)
  const parsedDiscount = useMemo(() => {
    const trimmed = discountInput.trim().replace(/%/g, '').trim()
    if (!trimmed) return null
    const num = parseFloat(trimmed)
    if (isNaN(num) || num < 0 || num > 100) return null
    return { value: num, type: 'percentage' as const }
  }, [discountInput])

  // Line total = unit price × quantity
  const lineTotal = useMemo(() => {
    return fullUnitPrice * quantity
  }, [fullUnitPrice, quantity])

  const discountAmount = useMemo(() => {
    if (!parsedDiscount) return 0
    return (lineTotal * parsedDiscount.value) / 100
  }, [parsedDiscount, lineTotal])

  // Round to 2 decimal places for accurate calculation
  // This recalculates automatically when quantity, modifiers, size, or discount changes
  const total = useMemo(() => {
    return Math.round((Math.max(0, lineTotal - discountAmount)) * 100) / 100
  }, [lineTotal, discountAmount])

  const handleAddToCart = () => {
    if (!product) return
    const cartItem = {
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      category: product.category,
      image: product.image,
      modifiers: [],
      notes: notes.trim() || undefined,
      discount: parsedDiscount?.value,
      discountType: parsedDiscount?.type,
      selectedSize: undefined,
    }
    onAddToCart(cartItem)
    onClose()
  }

  if (!isOpen || !product) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Editable Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onBlur={(e) => {
                const v = parseFloat(e.target.value)
                if (!Number.isNaN(v) && v >= 0) setPriceInput(v.toFixed(2))
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              placeholder="0.00"
            />
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Quantity</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, val))
                }}
                className="w-20 h-10 text-center border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="ml-auto text-base font-semibold text-gray-900">₹{(unitPrice * quantity).toFixed(2)}</span>
            </div>
          </div>

          {/* Discount */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-semibold text-gray-700">Discount</label>
              <span className="text-gray-400 cursor-help" title="Enter discount percentage (e.g. 10 or 10%)">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <input
              type="text"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Discount %"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Preparation Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preparation note:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
            />
          </div>
        </div>

        {/* Sticky Footer: Total + Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-2xl flex-shrink-0 shadow-lg z-10">
          {/* Total Price */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary-600">₹{total.toFixed(2)}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg"
          >
            {editingCartItem ? 'Update in Cart' : 'Add to cart'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
