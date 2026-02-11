'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import type { CartItem } from '@/types/pos'

interface EditItemModalProps {
  item: CartItem
  onClose: () => void
  onUpdate: (updates: {
    quantity: number
    discount?: number
    discountType?: 'percentage' | 'fixed'
    notes?: string
  }) => void
}

function getUnitPrice(item: CartItem): number {
  const modTotal = item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0
  return item.price + modTotal
}

function parseDiscountInput(raw: string): { value: number; type: 'percentage' } | null {
  const t = raw.trim()
  if (!t) return null
  // Remove % if present, always treat as percentage
  const num = parseFloat(t.replace(/%/g, '').trim())
  if (Number.isNaN(num) || num < 0 || num > 100) return null
  return { value: num, type: 'percentage' }
}

function EditItemModal({ item, onClose, onUpdate }: EditItemModalProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [discountInput, setDiscountInput] = useState(() => {
    if (!item.discount || item.discount <= 0) return ''
    return `${item.discount}%`
  })
  const [notes, setNotes] = useState(item.notes ?? '')

  useEffect(() => {
    setQuantity(item.quantity)
    setDiscountInput(
      !item.discount || item.discount <= 0
        ? ''
        : `${item.discount}%`
    )
    setNotes(item.notes ?? '')
  }, [item.id, item.quantity, item.discount, item.notes])

  const unitPrice = useMemo(() => getUnitPrice(item), [item])
  const lineTotal = quantity * unitPrice
  const parsed = useMemo(() => parseDiscountInput(discountInput), [discountInput])
  const discountAmount = useMemo(() => {
    if (!parsed) return 0
    // Always calculate as percentage
    return (lineTotal * parsed.value) / 100
  }, [parsed, lineTotal])
  const itemTotal = Math.max(0, lineTotal - discountAmount)

  const handleUpdate = () => {
    if (quantity <= 0) return
    const updates: {
      quantity: number
      discount?: number
      discountType?: 'percentage' | 'fixed'
      notes?: string
    } = { quantity, notes: notes.trim() }
    if (parsed) {
      updates.discount = parsed.value
      updates.discountType = 'percentage' // Always percentage
    } else {
      updates.discount = 0
      updates.discountType = 'percentage'
    }
    onUpdate(updates)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-item-title"
        className="bg-white rounded-2xl shadow-strong w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="edit-item-title" className="text-lg font-bold text-gray-900 truncate pr-2">{item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quantity */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-gray-700">Quantity</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-600 ml-1">₹{unitPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Discount */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm font-bold text-gray-700">Discount</span>
              <span
                className="text-gray-400 cursor-help"
                title="Enter percentage (e.g. 10 or 10%)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <input
              type="text"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Percentage (%)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-gray-700">Total</span>
              <span className="text-sm font-bold text-gray-900">₹{itemTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Preparation Note */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Preparation Note:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleUpdate}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Update in Cart
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

export default memo(EditItemModal)
