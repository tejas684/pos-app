'use client'

import { useMemo } from 'react'
import type { Order } from '@/types/pos'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
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

    const tips = order.tips || 0
    const selectedPersons = order.selectedPersons ?? 0
    const pricePerPerson = order.pricePerPerson ?? 0
    // Charge: use order.charge, or derive from persons × price when available
    const charge = order.charge ?? (selectedPersons > 0 && pricePerPerson > 0 ? selectedPersons * pricePerPerson : 0)
    const chargeRounded = Math.round(charge * 100) / 100

    return {
      totalProducts: order.items.length,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(itemDiscounts * 100) / 100,
      orderDiscount: Math.round(orderDiscount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      tips: Math.round(tips * 100) / 100,
      charge: chargeRounded,
      selectedPersons,
      pricePerPerson: Math.round(pricePerPerson * 100) / 100,
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

  // Format date for display (DD/MM/YYYY HH:mm)
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-xl shadow-strong w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Purple accent theme */}
        <div className="px-6 py-4 bg-accent-600 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white">Order Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Order Information - Left: Order Type, Date | Right: Order Number, Area, Table, Customer */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-900">Order Type: </span>
              <span className="text-gray-900">{getOrderTypeLabel(order.orderType)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Order Number: </span>
              <span className="text-gray-900">{formatOrderNumber(order.id)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Date: </span>
              <span className="text-gray-900">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Area: </span>
              <span className="text-gray-900">{order.area || '-'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Table Number: </span>
              <span className="text-gray-900">{order.tableName || '-'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Customer Name: </span>
              <span className="text-gray-900">{order.customer}</span>
            </div>
          </div>

          {/* Items Table - Accent header theme */}
          <div className="rounded-lg overflow-hidden border border-neutral-200 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent-700">
                  <th className="text-left py-3 px-4 font-semibold text-white">Items</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Size</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Qty</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Price</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-500">No items</td>
                  </tr>
                ) : (
                  order.items.map((item, index) => {
                    const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
                    const itemTotal = getItemTotal(item)
                    return (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                      >
                        <td className="py-3 px-4 text-gray-900">
                          <div>
                            <div className="font-medium">{item.name || 'Item'}</div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {item.modifiers.map((mod, i) => (
                                  <span key={i}>+ {mod.name}</span>
                                )).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-neutral-500 italic mt-0.5">Note: {item.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {item.selectedSize || '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-center text-gray-900">₹{itemPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center font-medium text-gray-900">₹{itemTotal.toFixed(2)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Order Summary - Clean layout like the image */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">SubTotal:</span>
              <span className="text-gray-900">₹{orderTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">
                {orderTotals.selectedPersons > 0 && orderTotals.pricePerPerson > 0
                  ? `Charge (${orderTotals.selectedPersons} person(s) @ ₹${orderTotals.pricePerPerson.toFixed(2)}):`
                  : 'Charge:'}
              </span>
              <span className="text-gray-900">₹{orderTotals.charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-accent-600">₹{orderTotals.totalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer - Success green close button */}
        <div className="px-6 py-4 border-t border-neutral-200 shrink-0 bg-neutral-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-success-500 text-white rounded-lg font-semibold hover:bg-success-600 transition-colors shadow-soft"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
