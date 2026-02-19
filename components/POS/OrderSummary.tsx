'use client'

import { useState, useRef, useEffect } from 'react'
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
    <div className="border-t border-primary-200/80 px-2 sm:px-3 py-1.5 bg-gradient-to-b from-white to-primary-50/30 shadow-soft text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2 relative" ref={calendarRef}>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all hover:text-primary-700 relative"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          {showCalendar && (
            <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-xl shadow-medium border border-primary-200 p-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end gap-0.5 w-full sm:w-auto">
          {/* Breakdown: Subtotal ± Order discount + Tips = Total */}
          {cartItemsCount > 0 && (
            <div className="text-left sm:text-right text-[10px] text-neutral-600 space-y-0.5 mb-0.5 w-full">
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-700">₹{subtotal.toFixed(2)}</span>
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
            <span className="text-xs font-semibold text-primary-700">Total payable:</span>
            <span className="text-sm sm:text-base font-bold text-primary-800">₹{totalPayable.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {/* Cart actions - scrollable row on small screens so all buttons stay accessible */}
      <div className="w-full min-w-0 mt-1 overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex flex-nowrap items-center justify-end gap-2 min-w-max">
        <button
          onClick={onClearCart}
          className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 focus:ring-offset-1 active:scale-[0.98] shadow-sm transition-all duration-200 touch-manipulation"
          title="Clear Cart (Esc)"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="truncate">Clear Cart</span>
        </button>
        {isModifyingOrder && onUpdateOrder ? (
          <button
            onClick={onUpdateOrder}
            className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 active:scale-[0.98] shadow-sm transition-all duration-200 touch-manipulation"
            title="Update Order (Enter)"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="truncate">Update</span>
          </button>
        ) : (
          <button
            onClick={onPlaceOrder}
            className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 active:scale-[0.98] shadow-sm transition-all duration-200 touch-manipulation"
            title="Place Order (Enter)"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:focus:ring-0 shadow-sm transition-all duration-200 touch-manipulation"
                title={canActOnOrder ? 'Order Details' : 'Select an order from Execution'}
              >
                {orderDetailsLoading ? (
                  <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:focus:ring-0 shadow-sm transition-all duration-200 touch-manipulation"
                title={canActOnOrder ? 'Reprint KOT' : 'Select an order from Execution'}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="truncate">KOT</span>
              </button>
            )}
            {onInvoice && (
              <button
                onClick={() => orderForActions && onInvoice(orderForActions)}
                disabled={!canActOnOrder}
                className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:focus:ring-0 shadow-sm transition-all duration-200 touch-manipulation"
                title={canActOnOrder ? 'Invoice' : 'Select an order from Execution'}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">Invoice</span>
              </button>
            )}
            {onCancelExecutionOrder && (
              <button
                onClick={() => orderForActions && onCancelExecutionOrder(orderForActions)}
                disabled={!canActOnOrder}
                className="inline-flex items-center justify-center gap-1 shrink-0 min-h-[28px] px-1.5 py-1 text-[10px] font-bold rounded-lg text-white bg-zinc-600 hover:bg-zinc-700 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:focus:ring-0 shadow-sm transition-all duration-200 touch-manipulation"
                title={canActOnOrder ? 'Cancel order' : 'Select an order from Execution'}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">Cancel Order</span>
              </button>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
