'use client'

import { useState, memo, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

interface DiscountModalProps {
  currentDiscount: number
  discountType: 'percentage' | 'fixed'
  subtotal?: number // Add subtotal to validate fixed discount
  onClose: () => void
  onApply: (discount: number, type: 'percentage' | 'fixed') => void
}

function DiscountModal({ currentDiscount, discountType, subtotal = 0, onClose, onApply }: DiscountModalProps) {
  const { showToast } = useToast()
  const [discount, setDiscount] = useState(currentDiscount.toString())

  useEffect(() => {
    setDiscount(currentDiscount.toString())
  }, [currentDiscount])

  const handleApply = () => {
    const discountValue = parseFloat(discount)
    
    // Validate that it's a valid number
    if (isNaN(discountValue)) {
      showToast('Please enter a valid discount value', 'error')
      return
    }
    
    // Always use percentage
    if (discountValue < 0 || discountValue > 100) {
      showToast('Percentage must be between 0 and 100', 'error')
      return
    }
    
    onApply(discountValue, 'percentage')
    showToast('Discount applied successfully', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 xs:p-4 overflow-y-auto">
      <div data-modal-content className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Apply Discount</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Discount Value */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min={0}
                max={100}
                step="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                placeholder="0-100"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">
                %
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Enter a value between 0 and 100</p>
          </div>

          {/* Quick Discount Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(percent => (
                <button
                  key={percent}
                  onClick={() => setDiscount(percent.toString())}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDiscount('0')
                onApply(0, 'percentage')
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(DiscountModal)
