'use client'

import { useState, memo, useEffect, useRef, useMemo } from 'react'
import { useToast } from '@/components/ui/Toast'
import { storeOrderPaymentApi } from '@/lib/api/pos'
import type { Order, CartItem } from '@/types/pos'
import type { OrderPaymentCardDetails } from '@/types/pos'

const CURRENCY_SYMBOL = '₹'

/** Per-line totals for invoice/payment (same as InvoiceBillModal). */
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

export interface BillSummaryValues {
  mrp: number
  sellingPrice: number
  cgst: number
  sgst: number
  igst: number
  vat: number
  discount: number
  charge: number
  tips: number
  payableAmount: number
}

export interface PaymentModalPayload {
  method: 'cash' | 'card'
  amount: number
  change?: number
  cardDetails?: OrderPaymentCardDetails
}

/** Cart context for invoice-style display when opening Payment from cart (same as Invoice modal). */
export interface CartContextForPayment {
  customerName: string
  tableName?: string
  waiter?: string
  orderType?: string
}

interface PaymentModalProps {
  /** When set, show order-based payment UI (Order Number, Order Items, Payment Details) and call payment API on submit. */
  order?: Order | null
  /** When opening from cart (no order), pass cart items so the modal shows the same Order Items table as the invoice. */
  cartItems?: CartItem[]
  /** When opening from cart, pass context so the modal shows Date, Customer, Table, Waiter, Order type like the invoice. */
  cartContext?: CartContextForPayment
  payableAmount: number
  billSummary: BillSummaryValues
  onClose: () => void
  onPayment: (data: PaymentModalPayload) => void
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 15 }, (_, i) => String(CURRENT_YEAR + i))

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

function PaymentModal({ order, cartItems = [], cartContext, payableAmount, billSummary, onClose, onPayment }: PaymentModalProps) {
  const { showToast } = useToast()
  const safePayable = Math.max(0, Number(payableAmount) || 0)
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  // Order-based payment state (when order is set – execution panel Invoice/Account)
  const [discountStr, setDiscountStr] = useState('0')
  const [onlineStr, setOnlineStr] = useState('0')
  const [cashStr, setCashStr] = useState('0')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Cart-based payment state (when no order – Finalize Sale from cart)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [amountReceived, setAmountReceived] = useState(safePayable.toFixed(2))
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvc, setCvc] = useState('')

  const isOrderPayment = order != null

  useEffect(() => {
    if (!isOrderPayment) {
      setAmountReceived(safePayable.toFixed(2))
    }
  }, [safePayable, isOrderPayment])

  // Order payment: balance = total - discount - online - cash
  const totalAmount = isOrderPayment ? (order?.total ?? safePayable) : safePayable
  const discountNum = isOrderPayment ? Math.max(0, parseFloat(discountStr) || 0) : 0
  const onlineNum = isOrderPayment ? Math.max(0, parseFloat(onlineStr) || 0) : 0
  const cashNum = isOrderPayment ? Math.max(0, parseFloat(cashStr) || 0) : 0
  const balance = Math.max(0, totalAmount - discountNum - onlineNum - cashNum)
  const canSubmitOrderPayment = isOrderPayment && balance === 0 && totalAmount > 0

  const amountNum = parseFloat(amountReceived) || 0
  const changeAmount = Math.max(0, amountNum - safePayable)
  const totalDue = Math.max(0, safePayable - amountNum)
  const canSubmitCart = !isOrderPayment && totalDue === 0 && (
    paymentMethod === 'cash' ||
    (paymentMethod === 'card' && cardNumber.trim() && cardHolderName.trim() && expiryMonth && expiryYear && cvc.trim().length >= 3)
  )
  const displayChangeAmount = paymentMethod === 'cash' ? changeAmount : 0

  const handleAmountChange = (value: string) => {
    if (value === '') {
      setAmountReceived('')
      return
    }
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return
    setAmountReceived(value)
  }

  const submitOrderPayment = async (openInvoiceAfter: boolean) => {
    if (!order || !canSubmitOrderPayment) return
    const orderIdNum = Number(order.id)
    if (Number.isNaN(orderIdNum)) {
      showToast('Invalid order ID', 'error')
      return
    }
    setSubmitting(true)
    try {
      await storeOrderPaymentApi({
        order_id: orderIdNum,
        total_amount: totalAmount,
        discount: discountNum,
        online_amount: onlineNum,
        cash_amount: cashNum,
        note: (note ?? '').trim(),
      })
      onPayment({ method: 'cash', amount: totalAmount })
      onClose()
      showToast('Payment submitted successfully', 'success')
      if (openInvoiceAfter) {
        // Parent will show invoice modal via lastPaidOrderForInvoice; no extra action here
      }
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Payment failed'
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitOrder = () => void submitOrderPayment(false)
  const handlePrintInvoice = () => void submitOrderPayment(true)

  const handleSubmitCart = () => {
    if (!canSubmitCart) return
    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardHolderName.trim() || !expiryMonth || !expiryYear || cvc.trim().length < 3) {
        showToast('Please fill all card details', 'error')
        return
      }
      onPayment({
        method: 'card',
        amount: safePayable,
        change: 0,
        cardDetails: {
          cardNumber: cardNumber.trim(),
          cardHolderName: cardHolderName.trim(),
          expiryMonth,
          expiryYear,
          cvc: cvc.trim(),
        },
      })
    } else {
      const paid = parseFloat(amountReceived) || 0
      if (paid < safePayable) {
        showToast('Amount received is less than payable amount', 'error')
        return
      }
      onPayment({
        method: 'cash',
        amount: paid,
        change: changeAmount,
      })
    }
  }

  if (isOrderPayment && order) {
    const orderNumber = order.orderNumber ?? order.id
    const charge = order.charge ?? 0
    const tips = order.tips ?? 0
    const orderDiscount = order.discount ?? 0
    const items = order.items ?? []
    const itemsLoading = items.length === 0

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xs:p-4 overflow-y-auto">
        <div data-modal-content className="bg-white rounded-xl shadow-strong w-full max-w-2xl mx-auto overflow-hidden border border-gray-200 flex-shrink-0">
          <div className="border-b border-gray-200 px-4 sm:px-5 py-4 bg-gradient-to-b from-white to-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Payment</h2>
              <button
                onClick={onClose}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:text-primary-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Order Number */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Order Number</span>
              <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">{orderNumber}</span>
            </div>

            {/* Order Items - same layout as invoice */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Order Items</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Item</th>
                      <th className="text-center py-2 px-2 w-12 font-semibold text-gray-700">Qty</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Price</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsLoading ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3 text-center text-gray-500">
                          Loading order details…
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const { unitPrice, itemDiscount, totalAfterDiscount, isPercentage, rawDiscount } = getItemLineTotals(item)
                        return (
                          <tr key={item.lineItemId || idx} className="border-b border-gray-100">
                            <td className="py-2 px-3">
                              <div className="font-medium text-gray-800">{item.name}</div>
                              {item.selectedSize && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Size: {item.selectedSize} — {CURRENCY_SYMBOL}{item.price.toFixed(2)}/unit
                                </div>
                              )}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Add-ons: {item.modifiers.map((m, i) => (
                                    <span key={i}>{m.name} (+{CURRENCY_SYMBOL}{m.price.toFixed(2)}){i < item.modifiers!.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                              )}
                              {itemDiscount > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Item discount: {isPercentage ? `${rawDiscount}%` : `${CURRENCY_SYMBOL}${rawDiscount.toFixed(2)} off`} — −{CURRENCY_SYMBOL}{itemDiscount.toFixed(2)}
                                </div>
                              )}
                              {item.notes && item.notes.trim() && (
                                <div className="text-xs text-gray-600 mt-0.5 italic">Note: {item.notes.trim()}</div>
                              )}
                            </td>
                            <td className="text-center py-2 px-2 align-top">{item.quantity}</td>
                            <td className="text-right py-2 px-3 align-top">{CURRENCY_SYMBOL}{unitPrice.toFixed(2)}</td>
                            <td className="text-right py-2 px-3 align-top">{CURRENCY_SYMBOL}{totalAfterDiscount.toFixed(2)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 space-y-1 text-sm">
                  {!itemsLoading && orderDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Order discount</span>
                      <span>−{CURRENCY_SYMBOL}{orderDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {!itemsLoading && charge > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Charge</span>
                      <span>{CURRENCY_SYMBOL}{charge.toFixed(2)}</span>
                    </div>
                  )}
                  {!itemsLoading && tips > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Tips</span>
                      <span>{CURRENCY_SYMBOL}{tips.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span>{CURRENCY_SYMBOL}{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  <label className="text-sm text-gray-700">Total Amt</label>
                  <input
                    type="text"
                    readOnly
                    value={totalAmount.toFixed(2)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-right font-medium"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-gray-700">Discount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-gray-700">Online</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={onlineStr}
                    onChange={(e) => setOnlineStr(e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-gray-700">Cash</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={cashStr}
                    onChange={(e) => setCashStr(e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  <label className="text-sm text-gray-700">Balance</label>
                  <input
                    type="text"
                    readOnly
                    value={balance.toFixed(2)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-right font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Note</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 sm:px-5 py-4 bg-gray-50/50 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={!canSubmitOrderPayment || submitting}
              className="px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handlePrintInvoice}
              disabled={!canSubmitOrderPayment || submitting}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:bg-red-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Cart: show same as Invoice modal (view bill + Close + Print Bill only, no payment form)
  const cartCharge = billSummary.charge ?? 0
  const cartTips = billSummary.tips ?? 0
  const cartOrderDiscount = billSummary.discount ?? 0
  const hasCartItems = cartItems.length > 0
  const cartOrderNumber = 'ORD-PENDING'
  const cartCreatedAt = new Date()
  const customerName = cartContext?.customerName ?? '—'
  const tableName = cartContext?.tableName
  const waiterName = cartContext?.waiter
  const orderTypeLabel = getOrderTypeLabel(cartContext?.orderType ?? 'dine-in')

  const cartItemsTotal = useMemo(() => {
    let total = 0
    for (const item of cartItems) {
      const { lineTotal } = getItemLineTotals(item)
      total += lineTotal
    }
    return total
  }, [cartItems])

  const handlePrintCartBill = () => {
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
          <title>Invoice - ${cartOrderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
            th { font-weight: 600; }
            .text-right { text-align: right; }
            .dashed { border-top: 1px dashed #999; margin: 12px 0; }
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
              {cartCreatedAt.toLocaleString()}
            </div>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-sm text-gray-600 mt-1">Order #: {cartOrderNumber}</p>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-gray-600">Date:</span> {formatDateTime(cartCreatedAt)}</p>
              <p><span className="text-gray-600">Customer:</span> {customerName}</p>
              {tableName != null && tableName !== '' && (
                <p><span className="text-gray-600">Table:</span> {tableName}</p>
              )}
              {waiterName != null && waiterName !== '' && (
                <p><span className="text-gray-600">Waiter:</span> {waiterName}</p>
              )}
              <p><span className="text-gray-600">Order type:</span> {orderTypeLabel}</p>
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
                {hasCartItems ? (
                  cartItems.map((item, index) => {
                    const { unitPrice, itemDiscount, totalAfterDiscount, isPercentage, rawDiscount } = getItemLineTotals(item)
                    return (
                      <tr key={item.lineItemId || index} className="border-b border-gray-100">
                        <td className="py-2">
                          <div className="font-medium">{index + 1}. {item.name}</div>
                          {item.selectedSize && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Size: {item.selectedSize} — {CURRENCY_SYMBOL}{item.price.toFixed(2)}/unit
                            </div>
                          )}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Add-ons: {item.modifiers.map((m, i) => (
                                <span key={i}>{m.name} (+{CURRENCY_SYMBOL}{m.price.toFixed(2)}){i < item.modifiers!.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                          {itemDiscount > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Item discount: {isPercentage ? `${rawDiscount}%` : `${CURRENCY_SYMBOL}${rawDiscount.toFixed(2)} off`} — −{CURRENCY_SYMBOL}{itemDiscount.toFixed(2)}
                            </div>
                          )}
                          {item.notes && item.notes.trim() && (
                            <div className="text-xs text-gray-600 mt-0.5 italic">Note: {item.notes.trim()}</div>
                          )}
                        </td>
                        <td className="text-center py-2 align-top">{item.quantity}</td>
                        <td className="text-right py-2 align-top">{CURRENCY_SYMBOL}{unitPrice.toFixed(2)}</td>
                        <td className="text-right py-2 align-top">{CURRENCY_SYMBOL}{totalAfterDiscount.toFixed(2)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">No items</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-b border-dashed border-gray-300 my-4" />

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items total</span>
                <span>{CURRENCY_SYMBOL}{cartItemsTotal.toFixed(2)}</span>
              </div>
              {cartOrderDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Order discount</span>
                  <span>−{CURRENCY_SYMBOL}{cartOrderDiscount.toFixed(2)}</span>
                </div>
              )}
              {cartCharge > 0 && (
                <div className="flex justify-between">
                  <span>Charge</span>
                  <span>{CURRENCY_SYMBOL}{cartCharge.toFixed(2)}</span>
                </div>
              )}
              {cartTips > 0 && (
                <div className="flex justify-between">
                  <span>Tips</span>
                  <span>{CURRENCY_SYMBOL}{cartTips.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-gray-300 my-4" />

            <div className="flex justify-between text-base font-bold">
              <span>Grand total</span>
              <span>{CURRENCY_SYMBOL}{safePayable.toFixed(2)}</span>
            </div>
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
            onClick={handlePrintCartBill}
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

export default memo(PaymentModal)
