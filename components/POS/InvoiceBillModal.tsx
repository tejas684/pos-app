'use client'

import { useState, useMemo } from 'react'
import { printInvoice } from '@/lib/invoicePrint'
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
  const [isPrinting, setIsPrinting] = useState(false)
  const [discount, setDiscount] = useState<string>(String(order.discount ?? 0))
  const [online, setOnline] = useState<string>(String(order.payment?.method === 'card' ? order.payment?.amount ?? 0 : 0))
  const [cash, setCash] = useState<string>(String(order.payment?.method === 'cash' ? order.payment?.amount ?? 0 : 0))
  const [note, setNote] = useState<string>('')

  const orderNumber = formatOrderNumber(order)
  const selectedPersons = order.selectedPersons ?? 0
  const pricePerPerson = order.pricePerPerson ?? 0
  const charge = order.charge ?? (selectedPersons > 0 && pricePerPerson > 0 ? selectedPersons * pricePerPerson : 0)

  const { itemsTotal } = useMemo(() => {
    let total = 0
    for (const item of order.items ?? []) {
      const { totalAfterDiscount } = getItemLineTotals(item)
      total += totalAfterDiscount
    }
    return { itemsTotal: total }
  }, [order.items])

  const totalAmt = order.total
  const discountNum = parseFloat(discount) || 0
  const onlineNum = parseFloat(online) || 0
  const cashNum = parseFloat(cash) || 0
  const balance = Math.max(0, totalAmt - discountNum - onlineNum - cashNum)

  const handlePrint = async () => {
    setIsPrinting(true)
    await printInvoice(order, CURRENCY)
    setIsPrinting(false)
  }

  const handleSubmit = () => {
    // Keep modal open; user closes via Close button or X
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/50 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-strong max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-bold text-neutral-800">Invoice / Bill</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:bg-neutral-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Order Number */}
          <div>
            <label className="block text-sm font-bold text-neutral-800 mb-1.5">Order Number</label>
            <div className="px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-800">
              {orderNumber}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-bold text-neutral-800 mb-2">Order Items</h3>
            <div className="invoice-print-content">
              <table className="w-full text-sm border border-neutral-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="py-2 px-3 text-left font-bold text-neutral-800 border-b border-r border-neutral-300">Product</th>
                    <th className="py-2 px-3 text-center font-bold text-neutral-800 border-b border-r border-neutral-300 w-14">Qty</th>
                    <th className="py-2 px-3 text-right font-bold text-neutral-800 border-b border-r border-neutral-300">Price</th>
                    <th className="py-2 px-3 text-right font-bold text-neutral-800 border-b border-neutral-300">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item, index) => {
                    const { unitPrice, totalAfterDiscount } = getItemLineTotals(item)
                    return (
                      <tr key={item.lineItemId || index} className="border-b border-neutral-200">
                        <td className="py-2 px-3 text-neutral-800 border-r border-neutral-200">{item.name}</td>
                        <td className="py-2 px-3 text-center text-neutral-800 border-r border-neutral-200">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-neutral-800 border-r border-neutral-200">{CURRENCY}{unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-neutral-800">{CURRENCY}{totalAfterDiscount.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-end gap-4">
                  <span className="font-bold text-neutral-800">
                    {selectedPersons > 0 && pricePerPerson > 0
                      ? `Charge (${selectedPersons} person(s) @ ${CURRENCY}${pricePerPerson.toFixed(2)})`
                      : 'Charge'}
                  </span>
                  <span className="text-neutral-800 min-w-[4rem] text-right">{CURRENCY}{charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-4 font-bold">
                  <span className="text-neutral-800">Grand Total</span>
                  <span className="text-neutral-800 min-w-[4rem] text-right">{CURRENCY}{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-bold text-neutral-800 mb-3">Payment Details</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0">Total Amt</label>
                <span className="text-neutral-800">{CURRENCY}{totalAmt.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0">Discount</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0">Online</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={online}
                  onChange={(e) => setOnline(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0">Cash</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0">Balance</label>
                <span className="text-neutral-800">{CURRENCY}{balance.toFixed(2)}</span>
              </div>
              <div className="flex items-start gap-3">
                <label className="text-sm font-bold text-neutral-800 w-20 shrink-0 pt-2">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Optional note..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-200 p-5 bg-neutral-50 space-y-3">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-success-500 text-white border border-success-500 rounded-xl font-semibold hover:bg-success-600 transition-colors"
            >
              Submit
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2.5 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
                  Print Invoice
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border-2 border-danger-500 text-danger-600 rounded-xl font-semibold hover:bg-danger-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
