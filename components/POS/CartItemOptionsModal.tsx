'use client'

import { useState, memo, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import InputModal from '@/components/ui/InputModal'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  modifiers?: { name: string; price: number }[]
  discount?: number
}

interface CartItemOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  totalItems: number
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed' // Kept for backward compatibility but always 'percentage'
  totalDiscount: number
  tax: number
  charge: number
  tips: number
  cartItems?: CartItem[]
  taxRate?: number
  onUpdateDiscount: (value: number) => void
  onUpdateCharge: (value: number) => void
  onUpdateTips: (value: number) => void
}

function CartItemOptionsModal({
  isOpen,
  onClose,
  totalItems,
  subtotal,
  discount,
  discountType,
  totalDiscount,
  tax,
  charge,
  tips,
  cartItems = [],
  taxRate = 10,
  onUpdateDiscount,
  onUpdateCharge,
  onUpdateTips,
}: CartItemOptionsModalProps) {
  const { showToast } = useToast()
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [showChargeInput, setShowChargeInput] = useState(false)
  const [showTipsInput, setShowTipsInput] = useState(false)
  const [showTaxDetails, setShowTaxDetails] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setShowDiscountInput(false)
      setShowChargeInput(false)
      setShowTipsInput(false)
      setShowTaxDetails(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDiscountSubmit = (value: string) => {
    const numValue = parseFloat(value)
    
    // Validate that it's a valid number
    if (isNaN(numValue)) {
      showToast('Please enter a valid discount value', 'error')
      return
    }
    
    if (numValue < 0) {
      showToast('Discount cannot be negative', 'error')
      return
    }
    
    // Always validate as percentage
    if (numValue > 100) {
      showToast('Percentage cannot exceed 100%', 'error')
      return
    }
    
    onUpdateDiscount(numValue)
    setShowDiscountInput(false)
    showToast('Discount updated', 'success')
  }

  const handleChargeSubmit = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0) {
      showToast('Charge cannot be negative', 'error')
      return
    }
    onUpdateCharge(numValue)
    setShowChargeInput(false)
    showToast('Charge updated', 'success')
  }

  const handleTipsSubmit = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0) {
      showToast('Tips cannot be negative', 'error')
      return
    }
    onUpdateTips(numValue)
    setShowTipsInput(false)
    showToast('Tips updated', 'success')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Cart Item Options</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Total Item */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Item:</span>
              <span className="text-sm font-semibold text-gray-900">{totalItems}</span>
            </div>

            {/* Sub Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Sub Total:</span>
              <span className="text-sm font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Discount:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {discount.toFixed(2)}%
                </span>
                <button
                  onClick={() => setShowDiscountInput(true)}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  aria-label="Edit discount"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Total Discount */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Discount:</span>
              <span className="text-sm font-semibold text-gray-900">₹{totalDiscount.toFixed(2)}</span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tax:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">₹{tax.toFixed(2)}</span>
                <button
                  onClick={() => setShowTaxDetails(!showTaxDetails)}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  aria-label="View tax details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tax Details */}
            {showTaxDetails && (
              <div className="ml-4 pl-4 border-l-2 border-primary-200 bg-primary-50 rounded p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">Tax Calculation (Per Product):</p>
                {cartItems.length > 0 ? (
                  <>
                    {cartItems.map((item, index) => {
                      // Calculate item price including modifiers
                      const itemPrice = item.price + (item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0)
                      // Calculate line total
                      const lineTotal = itemPrice * item.quantity
                      // Calculate tax for this item
                      const itemTax = lineTotal * (taxRate / 100)
                      return (
                        <div key={item.id || index} className="text-xs text-gray-700 space-y-0.5">
                          <p className="font-medium">{item.name} (Qty: {item.quantity}):</p>
                          <p className="ml-2">
                            ₹{itemPrice.toFixed(2)} × {item.quantity} = ₹{lineTotal.toFixed(2)}
                          </p>
                          <p className="ml-2 text-primary-600">
                            Tax ({taxRate}%): ₹{itemTax.toFixed(2)}
                          </p>
                        </div>
                      )
                    })}
                    <div className="pt-2 mt-2 border-t border-primary-200">
                      <p className="text-xs font-semibold text-gray-900">
                        Total Tax: ₹{tax.toFixed(2)} (Sum of all individual product taxes)
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-700">
                    Tax calculated individually for each product at {taxRate}% rate, then combined.
                  </p>
                )}
              </div>
            )}

            {/* Charge */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Charge:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">₹{charge.toFixed(2)}</span>
                <button
                  onClick={() => setShowChargeInput(true)}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  aria-label="Edit charge"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tips:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">₹{tips.toFixed(2)}</span>
                <button
                  onClick={() => setShowTipsInput(true)}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  aria-label="Edit tips"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Discount Input Modal */}
      <InputModal
        isOpen={showDiscountInput}
        onClose={() => setShowDiscountInput(false)}
        onSubmit={handleDiscountSubmit}
        title="Edit Discount"
        label="Discount Percentage (%)"
        placeholder="0-100"
        type="number"
        defaultValue={discount.toString()}
      />

      {/* Charge Input Modal */}
      <InputModal
        isOpen={showChargeInput}
        onClose={() => setShowChargeInput(false)}
        onSubmit={handleChargeSubmit}
        title="Edit Charge"
        label="Charge Amount (₹)"
        placeholder="0.00"
        type="number"
        defaultValue={charge.toString()}
      />

      {/* Tips Input Modal */}
      <InputModal
        isOpen={showTipsInput}
        onClose={() => setShowTipsInput(false)}
        onSubmit={handleTipsSubmit}
        title="Edit Tips"
        label="Tips Amount (₹)"
        placeholder="0.00"
        type="number"
        defaultValue={tips.toString()}
      />
    </>
  )
}

export default memo(CartItemOptionsModal)
