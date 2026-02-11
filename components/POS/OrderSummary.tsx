'use client'

import { useState, useRef, useEffect } from 'react'
import CartItemOptionsModal from './CartItemOptionsModal'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  modifiers?: { name: string; price: number }[]
  discount?: number
}

interface OrderSummaryProps {
  totalPayable: number
  cartItemsCount: number
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed'
  totalDiscount: number
  tax: number
  charge: number
  tips: number
  cartItems?: CartItem[]
  taxRate?: number
  isModifyingOrder?: boolean
  /** Selected table for this order (e.g. "Table 5") – shown in cart when set */
  selectedTable?: string
  onClearCart: () => void
  onShowPaymentModal: () => void
  onPlaceOrder: () => void
  onUpdateOrder?: () => void
  onUpdateDiscount: (value: number) => void
  onUpdateCharge: (value: number) => void
  onUpdateTips: (value: number) => void
}

export default function OrderSummary({
  totalPayable,
  cartItemsCount,
  subtotal,
  discount,
  discountType,
  totalDiscount,
  tax,
  charge,
  tips,
  cartItems = [],
  taxRate = 10,
  isModifyingOrder = false,
  selectedTable,
  onClearCart,
  onShowPaymentModal,
  onPlaceOrder,
  onUpdateOrder,
  onUpdateDiscount,
  onUpdateCharge,
  onUpdateTips,
}: OrderSummaryProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showCartItemOptions, setShowCartItemOptions] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  return (
    <div className="border-t border-gray-200/80 px-3 sm:px-5 py-4 bg-gradient-to-b from-white to-gray-50/50 shadow-soft">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 relative" ref={calendarRef}>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:text-primary-600 relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          {showCalendar && (
            <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          )}
          <button 
            onClick={() => setShowCartItemOptions(true)}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:text-primary-600"
            aria-label="View cart item options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-0.5 w-full sm:w-auto">
          {selectedTable && (
            <div className="flex items-center gap-2 mb-2 w-full sm:justify-end">
              <span className="text-sm font-semibold text-gray-600">Table no:</span>
              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-sm font-medium">{selectedTable}</span>
            </div>
          )}
          {/* Breakdown: Subtotal ± Order discount + Tax + Charge + Tips = Total */}
          {cartItemsCount > 0 && (
            <div className="text-left sm:text-right text-xs text-gray-500 space-y-0.5 mb-1 w-full">
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between sm:justify-end gap-3 text-success-600">
                  <span>Order discount ({discount}%)</span>
                  <span>−₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {charge > 0 && (
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span>Charge</span>
                  <span>₹{charge.toFixed(2)}</span>
                </div>
              )}
              {tips > 0 && (
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span>Tips</span>
                  <span>₹{tips.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <span className="text-sm sm:text-base font-semibold text-gray-700">Total payable:</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">₹{totalPayable.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
        <button
              onClick={onClearCart}
              className="col-span-2 sm:flex-1 sm:min-w-[100px] px-4 sm:px-4 py-3.5 sm:py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:bg-red-700 transition-all flex items-center justify-center gap-2 text-base sm:text-base min-h-[48px] sm:min-h-0 touch-manipulation shadow-md hover:shadow-lg"
              title="Clear Cart (Esc)"
            >
              <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Cancel</span>
              <span className="sm:hidden">Cancel</span>
            </button>
            <button 
              onClick={onShowPaymentModal}
              className="flex-1 min-w-0 sm:min-w-[100px] px-3 sm:px-4 py-3.5 sm:py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:bg-blue-700 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base min-h-[48px] sm:min-h-0 touch-manipulation shadow-md hover:shadow-lg"
              title="Payment"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="hidden sm:inline">Payment</span>
              <span className="sm:hidden">Payment</span>
            </button>
            {isModifyingOrder && onUpdateOrder ? (
              <button
                onClick={onUpdateOrder}
                className="col-span-2 sm:flex-1 sm:min-w-[100px] px-4 sm:px-4 py-3.5 sm:py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-all flex items-center justify-center gap-2 text-base sm:text-base min-h-[48px] sm:min-h-0 touch-manipulation shadow-md hover:shadow-lg"
                title="Update Order (Enter)"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Update Order</span>
                <span className="sm:hidden">Update</span>
              </button>
            ) : (
              <button
                onClick={onPlaceOrder}
                className="col-span-2 sm:flex-1 sm:min-w-[100px] px-4 sm:px-4 py-3.5 sm:py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-all flex items-center justify-center gap-2 text-base sm:text-base min-h-[48px] sm:min-h-0 touch-manipulation shadow-md hover:shadow-lg"
                title="Place Order (Enter)"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="hidden sm:inline">Place Order</span>
                <span className="sm:hidden">Place</span>
              </button>
            )}
      </div>

      {/* Cart Item Options Modal */}
      <CartItemOptionsModal
        isOpen={showCartItemOptions}
        onClose={() => setShowCartItemOptions(false)}
        totalItems={cartItemsCount}
        subtotal={subtotal}
        discount={discount}
        discountType={discountType}
        totalDiscount={totalDiscount}
        tax={tax}
        charge={charge}
        tips={tips}
        cartItems={cartItems}
        taxRate={taxRate}
        onUpdateDiscount={onUpdateDiscount}
        onUpdateCharge={onUpdateCharge}
        onUpdateTips={onUpdateTips}
      />
    </div>
  )
}
