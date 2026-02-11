'use client'

import { useState, memo, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { OrderPaymentCardDetails } from '@/types/pos'

const CURRENCY_SYMBOL = '₹'

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

interface PaymentModalProps {
  payableAmount: number
  billSummary: BillSummaryValues
  onClose: () => void
  onPayment: (data: PaymentModalPayload) => void
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 15 }, (_, i) => String(CURRENT_YEAR + i))

function PaymentModal({ payableAmount, billSummary, onClose, onPayment }: PaymentModalProps) {
  const { showToast } = useToast()
  const safePayable = Math.max(0, Number(payableAmount) || 0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [amountReceived, setAmountReceived] = useState(safePayable.toFixed(2))
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvc, setCvc] = useState('')

  useEffect(() => {
    setAmountReceived(safePayable.toFixed(2))
  }, [safePayable])

  const amountNum = parseFloat(amountReceived) || 0
  const changeAmount = Math.max(0, amountNum - safePayable)
  const totalDue = Math.max(0, safePayable - amountNum)
  const canSubmit = totalDue === 0 && (paymentMethod === 'cash' || (paymentMethod === 'card' && cardNumber.trim() && cardHolderName.trim() && expiryMonth && expiryYear && cvc.trim().length >= 3))
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

  const handleSubmit = () => {
    if (!canSubmit) return
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xs:p-4 overflow-y-auto">
      <div data-modal-content className="bg-white rounded-xl shadow-strong w-full max-w-2xl mx-auto overflow-hidden border border-gray-200 flex-shrink-0">
        {/* Header - same POS style */}
        <div className="border-b border-gray-200 px-4 sm:px-5 py-4 bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Finalize Sale</h2>
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

        <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
          {/* Left: Payment method + card details */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash')
                    setAmountReceived(safePayable.toFixed(2))
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 min-h-[48px] ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('card')
                    setAmountReceived(safePayable.toFixed(2))
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 min-h-[48px] ${
                    paymentMethod === 'card'
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Card
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-3 pt-1">
                <label className="block text-sm font-semibold text-gray-700">Card Details</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Credit Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Card Holder Name"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-neutral-400"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                      <option value="">Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="CVC"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Amount Received + Bill Summary - same summary panel styling as POS */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount Received</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountReceived}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  readOnly={paymentMethod === 'card'}
                  className={`w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    paymentMethod === 'card' ? 'bg-gray-100 text-gray-700' : 'bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-b from-white to-gray-50/50 shadow-soft">
              <p className="text-sm font-semibold text-gray-700 mb-3">Bill Summary</p>
              <div className="text-xs text-gray-600 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span>MRP</span>
                  <span>{CURRENCY_SYMBOL}{billSummary.mrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Selling Price</span>
                  <span>{CURRENCY_SYMBOL}{billSummary.sellingPrice.toFixed(2)}</span>
                </div>
                {billSummary.cgst > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>CGST</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.cgst.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.sgst > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>SGST</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.sgst.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.igst > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>IGST</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.igst.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.vat > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>VAT</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.vat.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.discount > 0 && (
                  <div className="flex justify-between gap-2 text-danger-600">
                    <span>Discount</span>
                    <span>−{CURRENCY_SYMBOL}{billSummary.discount.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.charge > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>Charge</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.charge.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.tips > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>Tips</span>
                    <span>{CURRENCY_SYMBOL}{billSummary.tips.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2 font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
                  <span>Payable Amount</span>
                  <span>{CURRENCY_SYMBOL}{billSummary.payableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Amount Received</span>
                  <span>{CURRENCY_SYMBOL}{amountNum.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between gap-2 font-semibold ${displayChangeAmount > 0 ? 'text-success-600' : 'text-gray-600'}`}>
                  <span>Change Amount</span>
                  <span>{CURRENCY_SYMBOL}{displayChangeAmount.toFixed(2)}</span>
                </div>
                {totalDue > 0 && (
                  <div className="flex justify-between gap-2 text-danger-600 font-semibold">
                    <span>Total Due</span>
                    <span>{CURRENCY_SYMBOL}{totalDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - same POS button styles */}
        <div className="border-t border-gray-200 px-4 sm:px-5 py-4 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            Submit & Print
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(PaymentModal)
