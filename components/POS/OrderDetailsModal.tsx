'use client'

import { useMemo } from 'react'
import type { Order } from '@/types/pos'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onCreateInvoiceAndClose?: () => void
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onCreateInvoiceAndClose,
}: OrderDetailsModalProps) {
  // Format order number (e.g., "mJH260123-005")
  const formatOrderNumber = (orderId: string) => {
    if (orderId.includes('-') && orderId.length > 10) {
      return orderId
    }
    if (orderId.startsWith('ORD-')) {
      const timestamp = orderId.replace('ORD-', '')
      const date = new Date(parseInt(timestamp))
      const year = date.getFullYear().toString().slice(-2)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = timestamp.slice(-3).padStart(3, '0')
      return `mJH${year}${month}${day}-${random}`
    }
    return orderId
  }

  const getOrderTypeLabel = (orderType: string) => {
    switch (orderType) {
      case 'dine-in':
        return 'Dine in'
      case 'take-away':
        return 'Takeaway'
      case 'delivery':
        return 'Delivery'
      default:
        return orderType
    }
  }

  // Calculate order totals
  const orderTotals = useMemo(() => {
    if (!order) return null

    // Calculate subtotal from items (sum of item totals after item discounts)
    const subtotal = order.items.reduce((sum, item) => {
      const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
      const lineTotal = itemPrice * item.quantity
      const itemDiscount = !item.discount || item.discount <= 0
        ? 0
        : (lineTotal * item.discount) / 100
      return sum + (lineTotal - itemDiscount)
    }, 0)

    // Calculate total item discounts (sum of all item-level discounts)
    const itemDiscounts = order.items.reduce((sum, item) => {
      const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
      const lineTotal = itemPrice * item.quantity
      const itemDiscount = !item.discount || item.discount <= 0
        ? 0
        : (lineTotal * item.discount) / 100
      return sum + itemDiscount
    }, 0)

    // Order-level discount (separate from item discounts)
    const orderDiscount = order.discount || 0

    const tax = 0

    // Charge and tips from order
    const charge = order.charge || 0
    const tips = order.tips || 0

    return {
      totalProducts: order.items.length,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(itemDiscounts * 100) / 100, // Only item discounts
      orderDiscount: Math.round(orderDiscount * 100) / 100, // Order-level discount
      tax: Math.round(tax * 100) / 100,
      charge: Math.round(charge * 100) / 100,
      tips: Math.round(tips * 100) / 100,
      totalPayable: order.total,
    }
  }, [order])

  // Calculate item totals for display
  const getItemTotal = (item: Order['items'][0]) => {
    const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
    const lineTotal = itemPrice * item.quantity
    const itemDiscount = !item.discount || item.discount <= 0
      ? 0
      : (lineTotal * item.discount) / 100
    return Math.round((lineTotal - itemDiscount) * 100) / 100
  }

  const getItemDiscount = (item: Order['items'][0]) => {
    const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
    const lineTotal = itemPrice * item.quantity
    const itemDiscount = !item.discount || item.discount <= 0
      ? 0
      : (lineTotal * item.discount) / 100
    return Math.round(itemDiscount * 100) / 100
  }

  if (!isOpen || !order || !orderTotals) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
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
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order Type:</span>
              <span className="ml-2 font-medium text-gray-900">{getOrderTypeLabel(order.orderType)}</span>
            </div>
            <div>
              <span className="text-gray-600">Order Number:</span>
              <span className="ml-2 font-medium text-gray-900">{formatOrderNumber(order.id)}</span>
            </div>
            <div>
              <span className="text-gray-600">GARZÓN (Waiter):</span>
              <span className="ml-2 font-medium text-gray-900">{order.waiter || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Client:</span>
              <span className="ml-2 font-medium text-gray-900">{order.customer}</span>
            </div>
            <div>
              <span className="text-gray-600">Table:</span>
              <span className="ml-2 font-medium text-gray-900">{order.tableName || 'None'}</span>
            </div>
          </div>

          {/* Items: Name & Price (and full line details) */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Price</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Discount</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">No items</td>
                  </tr>
                ) : (
                  order.items.map((item, index) => {
                    const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
                    const itemDiscount = getItemDiscount(item)
                    const itemTotal = getItemTotal(item)
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-900">
                          <div>
                            <div className="font-medium">{item.name || 'Item'}</div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.modifiers.map((mod, i) => (
                                  <span key={i}>+ {mod.name}</span>
                                )).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-gray-500 italic mt-1">Note: {item.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900">₹{itemPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-gray-900">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-900">₹{itemDiscount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">₹{itemTotal.toFixed(2)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Information */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total products:</span>
              <span className="font-medium text-gray-900">{orderTotals.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sub Total:</span>
              <span className="font-medium text-gray-900">₹{orderTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Discount:</span>
              <span className="font-medium text-gray-900">₹{orderTotals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Load:</span>
              <span className="font-medium text-gray-900">₹{orderTotals.charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-gray-900">₹{orderTotals.orderDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tips:</span>
              <span className="font-medium text-gray-900">₹{orderTotals.tips.toFixed(2)}</span>
            </div>
          </div>

          {/* Total Payable */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total payable</span>
              <span className="text-2xl font-bold text-gray-900">₹{orderTotals.totalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
          {onCreateInvoiceAndClose && (
            <button
              onClick={() => {
                onCreateInvoiceAndClose()
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create Invoice and Close
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
