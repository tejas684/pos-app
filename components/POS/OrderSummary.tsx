'use client'

import { useState, useRef, useEffect } from 'react'
import CartItemOptionsModal from './CartItemOptionsModal'
import type { Order } from '@/types/pos'

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function getStatusLabel(status: Order['status'] | undefined): string {
  return status != null && status in STATUS_LABELS ? STATUS_LABELS[status] : 'Placed'
}

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
  tips: number
  cartItems?: CartItem[]
  taxRate?: number
  isModifyingOrder?: boolean
  /** Selected table for this order (e.g. "Table 5") – shown in cart when set */
  selectedTable?: string
  onClearCart: () => void
  onPlaceOrder: () => void
  onUpdateOrder?: () => void
  onUpdateDiscount: (value: number) => void
  onUpdateTips: (value: number) => void
  /** Order currently loaded for modification – enables Details, KOT, Invoice, Cancel order actions in cart */
  orderForActions?: Order | null
  /** When null/undefined, the four action buttons (Details, KOT, Invoice, Cancel ord.) are disabled */
  selectedExecutionOrderId?: string | null
  orderDetailsLoading?: boolean
  onOrderDetails?: (order: Order) => void
  onReprintKOT?: (order: Order) => void
  onInvoice?: (order: Order) => void
  onCancelExecutionOrder?: (order: Order) => void
}

export default function OrderSummary({
  totalPayable,
  cartItemsCount,
  subtotal,
  discount,
  discountType,
  totalDiscount,
  tax,
  tips,
  cartItems = [],
  taxRate = 10,
  isModifyingOrder = false,
  selectedTable,
  onClearCart,
  onPlaceOrder,
  onUpdateOrder,
  onUpdateDiscount,
  onUpdateTips,
  orderForActions = null,
  selectedExecutionOrderId = null,
  orderDetailsLoading = false,
  onOrderDetails,
  onReprintKOT,
  onInvoice,
  onCancelExecutionOrder,
}: OrderSummaryProps) {
  const hasExecutionHandlers = onOrderDetails ?? onReprintKOT ?? onInvoice ?? onCancelExecutionOrder
  const canActOnOrder = !!orderForActions && !!hasExecutionHandlers && !!selectedExecutionOrderId
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
    <div className="border-t border-gray-200/80 px-2 sm:px-3 py-2 bg-gradient-to-b from-white to-gray-50/50 shadow-soft">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
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
          {/* Breakdown: Subtotal ± Order discount + Tips = Total */}
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
      {/* Cart actions: compact so all fit in one row at 100% zoom */}
      <div className="flex flex-nowrap items-center justify-between gap-1 w-full min-w-0">
        <button
          onClick={onClearCart}
          className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-sm transition-colors touch-manipulation min-w-0"
          title="Clear Cart (Esc)"
        >
          <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="truncate">Cancel</span>
        </button>
        {isModifyingOrder && onUpdateOrder ? (
          <button
            onClick={onUpdateOrder}
            className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm transition-colors touch-manipulation min-w-0"
            title="Update Order (Enter)"
          >
            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="truncate">Update</span>
          </button>
        ) : (
          <button
            onClick={onPlaceOrder}
            className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm transition-colors touch-manipulation min-w-0"
            title="Place Order (Enter)"
          >
            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="truncate">Place Order</span>
          </button>
        )}
        {hasExecutionHandlers && (
          <>
            {onOrderDetails && (
              <button
                onClick={() => orderForActions && onOrderDetails(orderForActions)}
                disabled={!canActOnOrder || orderDetailsLoading}
                className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shadow-sm transition-colors touch-manipulation min-w-0"
                title={canActOnOrder ? 'Order Details' : 'Select an order from Execution'}
              >
                {orderDetailsLoading ? (
                  <svg className="w-2.5 h-2.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="truncate">{orderDetailsLoading ? '…' : 'Details'}</span>
              </button>
            )}
            {onReprintKOT && (
              <button
                onClick={() => orderForActions && onReprintKOT(orderForActions)}
                disabled={!canActOnOrder}
                className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shadow-sm transition-colors touch-manipulation min-w-0"
                title={canActOnOrder ? `Reprint KOT · ${getStatusLabel(orderForActions?.status)}` : 'Select an order from Execution'}
              >
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="truncate">
                  KOT{canActOnOrder && orderForActions?.status != null ? ` · ${getStatusLabel(orderForActions.status)}` : ''}
                </span>
              </button>
            )}
            {onInvoice && (
              <button
                onClick={() => orderForActions && onInvoice(orderForActions)}
                disabled={!canActOnOrder}
                className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shadow-sm transition-colors touch-manipulation min-w-0"
                title={canActOnOrder ? 'Invoice' : 'Select an order from Execution'}
              >
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">Invoice</span>
              </button>
            )}
            {onCancelExecutionOrder && (
              <button
                onClick={() => orderForActions && onCancelExecutionOrder(orderForActions)}
                disabled={!canActOnOrder}
                className="inline-flex items-center justify-center gap-0.5 shrink-0 px-1.5 py-1 text-[9px] font-semibold rounded-md bg-neutral-700 text-white hover:bg-neutral-800 active:bg-neutral-900 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed shadow-sm transition-colors touch-manipulation min-w-0"
                title={canActOnOrder ? 'Cancel order' : 'Select an order from Execution'}
              >
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">Cancel ord.</span>
              </button>
            )}
          </>
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
        tips={tips}
        cartItems={cartItems}
        taxRate={taxRate}
        onUpdateDiscount={onUpdateDiscount}
        onUpdateTips={onUpdateTips}
      />
    </div>
  )
}
