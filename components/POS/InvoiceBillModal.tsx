'use client'

import { useRef, useState, useMemo } from 'react'
import type { Order, CartItem } from '@/types/pos'

const CURRENCY = '₹'

interface InvoiceBillModalProps {
  order: Order
  onClose: () => void
}

function formatOrderNumber(order: Order) {
  return order.orderNumber ?? order.id
}

function formatDateTime(date: Date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function getOrderTypeLabel(orderType: string) {
  switch (orderType) {
    case 'dine-in': return 'Dine in'
    case 'take-away': return 'Takeaway'
    case 'delivery': return 'Delivery'
    default: return orderType
  }
}

/** Per-line: unit price (base + modifiers), line total, item discount, total after discount */
function getItemLineTotals(item: CartItem) {
  const unitPrice = item.price + (item.modifiers?.reduce((s, m) => s + m.price, 0) || 0)
  const lineTotal = unitPrice * item.quantity
  const isPercentage = item.discountType === 'percentage'
  const rawDiscount = item.discount ?? 0
  const itemDiscount =
    rawDiscount <= 0
      ? 0
      : isPercentage
        ? (lineTotal * Math.min(100, rawDiscount)) / 100
        : Math.min(rawDiscount * item.quantity, lineTotal)
  const totalAfterDiscount = Math.max(0, lineTotal - itemDiscount)
  return { unitPrice, lineTotal, itemDiscount, totalAfterDiscount, isPercentage, rawDiscount }
}

export default function InvoiceBillModal({ order, onClose }: InvoiceBillModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const orderNumber = formatOrderNumber(order)
  const tips = order.tips ?? 0
  const charge = order.charge ?? 0
  const orderDiscount = order.discount ?? 0
  const paidAmount = order.payment?.amount ?? 0
  const changeAmount = order.payment?.change ?? 0

  // Items total = sum of (item price × qty) after item-level discounts (not pre-discount line total)
  const { itemsTotal } = useMemo(() => {
    let total = 0
    for (const item of order.items ?? []) {
      const { totalAfterDiscount } = getItemLineTotals(item)
      total += totalAfterDiscount
    }
    return { itemsTotal: total }
  }, [order.items])

  const handlePrint = () => {
    if (!printRef.current) return
    setIsPrinting(true)
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      window.print()
      setIsPrinting(false)
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; color: #111; }
            .invoice-header { text-align: center; margin-bottom: 16px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
            .order-id { font-size: 14px; color: #444; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
            th { font-weight: 600; }
            .text-right { text-align: right; }
            .dashed { border-top: 1px dashed #999; margin: 12px 0; }
            .totals { margin-top: 16px; }
            .grand-total { font-size: 18px; font-weight: bold; margin-top: 8px; }
            .addons { font-size: 12px; color: #555; margin-top: 2px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
      setIsPrinting(false)
    }, 250)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Invoice / Bill</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div ref={printRef} className="invoice-print-content bg-white text-gray-900">
            <div className="text-right text-sm text-gray-500 mb-2">
              {new Date().toLocaleString()}
            </div>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-sm text-gray-600 mt-1">Order #: {orderNumber}</p>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-gray-600">Date:</span> {formatDateTime(order.createdAt)}</p>
              <p><span className="text-gray-600">Customer:</span> {order.customer}</p>
              {order.tableName && (
                <p><span className="text-gray-600">Table:</span> {order.tableName}</p>
              )}
              {order.waiter && (
                <p><span className="text-gray-600">Waiter:</span> {order.waiter}</p>
              )}
              <p><span className="text-gray-600">Order type:</span> {getOrderTypeLabel(order.orderType ?? 'dine-in')}</p>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 my-4" />

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2 w-12">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item, index) => {
                  const { unitPrice, itemDiscount, totalAfterDiscount, isPercentage, rawDiscount } = getItemLineTotals(item)
                  return (
                    <tr key={item.lineItemId || index} className="border-b border-gray-100">
                      <td className="py-2">
                        <div className="font-medium">{index + 1}. {item.name}</div>
                        {item.selectedSize && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Size: {item.selectedSize} — {CURRENCY}{item.price.toFixed(2)}/unit
                          </div>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Add-ons: {item.modifiers.map((m, i) => (
                              <span key={i}>{m.name} (+{CURRENCY}{m.price.toFixed(2)}){i < item.modifiers!.length - 1 ? ', ' : ''}</span>
                            ))}
                          </div>
                        )}
                        {itemDiscount > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Item discount: {isPercentage ? `${rawDiscount}%` : `${CURRENCY}${rawDiscount.toFixed(2)} off`} — −{CURRENCY}{itemDiscount.toFixed(2)}
                          </div>
                        )}
                        {item.notes && item.notes.trim() && (
                          <div className="text-xs text-gray-600 mt-0.5 italic">
                            Note: {item.notes.trim()}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-2 align-top">{item.quantity}</td>
                      <td className="text-right py-2 align-top">{CURRENCY}{unitPrice.toFixed(2)}</td>
                      <td className="text-right py-2 align-top">{CURRENCY}{totalAfterDiscount.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="border-t border-b border-dashed border-gray-300 my-4" />

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items total</span>
                <span>{CURRENCY}{itemsTotal.toFixed(2)}</span>
              </div>
              {orderDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Order discount</span>
                  <span>−{CURRENCY}{orderDiscount.toFixed(2)}</span>
                </div>
              )}
              {charge > 0 && (
                <div className="flex justify-between">
                  <span>Charge</span>
                  <span>{CURRENCY}{charge.toFixed(2)}</span>
                </div>
              )}
              {tips > 0 && (
                <div className="flex justify-between">
                  <span>Tips</span>
                  <span>{CURRENCY}{tips.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-gray-300 my-4" />

            <div className="flex justify-between text-base font-bold">
              <span>Grand total</span>
              <span>{CURRENCY}{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 text-green-700 font-semibold">
              <span>Paid amount</span>
              <span>{CURRENCY}{paidAmount.toFixed(2)}</span>
            </div>
            {changeAmount > 0 && (
              <div className="flex justify-between text-sm mt-1 text-gray-600">
                <span>Change</span>
                <span>{CURRENCY}{changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isPrinting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Printing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Bill
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
