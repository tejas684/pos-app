'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fetchOrderDetails } from '@/lib/api/pos'
import { buildInvoicePrintHtml } from '@/lib/invoicePrint'
import type { Order } from '@/types/pos'

const CURRENCY = '₹'

export default function InvoicePage() {
  const params = useParams()
  const orderId = typeof params?.orderId === 'string' ? params.orderId : ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setError('Invalid invoice link.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchOrderDetails(orderId)
      .then(({ order: o }) => {
        if (!cancelled && o?.id != null) {
          setOrder(o)
          setError(null)
        } else if (!cancelled) {
          setError('Order not found.')
          setOrder(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg =
            e && typeof e === 'object' && 'message' in e
              ? String((e as { message: unknown }).message)
              : 'Invoice could not be loaded.'
          setError(msg.includes('401') || msg.includes('403') ? 'Please log in to view this invoice, or ask the store to send you the link again.' : msg)
          setOrder(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Loading invoice…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <p className="text-red-600 font-medium">{error ?? 'Invoice not available.'}</p>
        <p className="text-gray-600 mt-2 text-sm">Please contact the store for your invoice.</p>
      </div>
    )
  }

  const html = buildInvoicePrintHtml(order, CURRENCY)

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-md mx-auto p-6 print:p-0">
        {/* Print / Save as PDF - hidden when printing */}
        <div className="mb-6 print:hidden flex flex-col items-center gap-3">
          <p className="text-gray-600 text-sm">
            Use the button below to print or save this invoice as PDF.
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>

        <div
          className="bg-white rounded-xl shadow-md p-6 print:shadow-none print:rounded-none invoice-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style jsx global>{`
        .invoice-content {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          color: #111;
          line-height: 1.5;
        }
        .invoice-content .invoice-title { text-align: center; font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
        .invoice-content .order-line, .invoice-content .info-line { margin: 2px 0; font-size: 14px; }
        .invoice-content .dashed { border: none; border-top: 1px dashed #999; margin: 10px 0; }
        .invoice-content .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px; }
        .invoice-content .items-table th, .invoice-content .items-table td { padding: 6px 8px; }
        .invoice-content .cell.center { text-align: center; }
        .invoice-content .cell.right { text-align: right; }
        .invoice-content .subtotal-row, .invoice-content .summary-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .invoice-content .grand-total-row { display: flex; justify-content: space-between; margin: 8px 0 0 0; font-weight: bold; }
        .invoice-content .footer-msg { text-align: center; margin: 14px 0 0 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
