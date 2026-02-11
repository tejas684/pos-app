/**
 * ============================================================================
 * KITCHEN ORDER TICKET (KOT) Component
 * ============================================================================
 * 
 * This component displays a print-friendly kitchen order ticket/receipt.
 * It's designed to be automatically printed and downloaded as PDF after placing an order.
 * 
 * Features:
 * - Print-optimized layout (no headers/footers)
 * - Displays all order information (order type, number, customer, waiter, items)
 * - Automatically formats date and time
 * - Clean, receipt-style design
 * - Automatic print and PDF download
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import type { Order } from '@/types/pos'

interface KitchenOrderTicketProps {
  order: Order
  onPrintComplete?: () => void
  autoPrint?: boolean
  autoDownload?: boolean
}

export default function KitchenOrderTicket({ 
  order, 
  onPrintComplete,
  autoPrint = true,
  autoDownload = true 
}: KitchenOrderTicketProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showModal, setShowModal] = useState(true)

  // Function to download as PDF using browser print API
  const downloadAsPDF = async () => {
    if (!printRef.current) return

    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      // Get the HTML content with styles
      const content = printRef.current.innerHTML
      
      // Get computed styles
      const computedStyles = window.getComputedStyle(printRef.current)
      const styles = `
        @page {
          margin: 0;
          size: auto;
        }
        body {
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
        .print-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-1 { margin-top: 4px; }
        .ml-4 { margin-left: 16px; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 14px; }
        .font-semibold { font-weight: 600; }
        .text-gray-600 { color: #4b5563; }
        .text-center { text-align: center; }
        .flex { display: flex; }
        .flex-1 { flex: 1; }
        .justify-between { justify-content: space-between; }
        .items-start { align-items: flex-start; }
        hr { border: 0; border-top: 1px solid #9ca3af; }
      `

      // Write content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Kitchen Order Ticket - ${displayOrderNumber}</title>
              <style>${styles}</style>
            </head>
            <body>
              ${content}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 100);
                };
              </script>
            </body>
          </html>
        `)
        iframeDoc.close()

        // Fallback: if onload doesn't fire, try printing after a delay
        setTimeout(() => {
          if (iframe.contentWindow) {
            try {
              iframe.contentWindow.focus()
              iframe.contentWindow.print()
            } catch (e) {
              console.error('Print error:', e)
              // Fall back to regular print
              window.print()
            }
            // Remove iframe after printing
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe)
              }
            }, 2000)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // Fall back to regular print
      window.print()
    }
  }

  // Function to trigger print
  const handlePrint = () => {
    if (!printRef.current) return
    
    setIsPrinting(true)
    
    // If auto-download is enabled, use the download function which also prints
    if (autoDownload) {
      downloadAsPDF()
      // Call onPrintComplete after a delay
      setTimeout(() => {
        setIsPrinting(false)
        if (onPrintComplete) {
          onPrintComplete()
        }
      }, 2000)
    } else {
      // Just trigger browser print dialog
      window.print()
      // Call onPrintComplete after a delay
      setTimeout(() => {
        setIsPrinting(false)
        if (onPrintComplete) {
          onPrintComplete()
        }
      }, 1000)
    }
  }

  useEffect(() => {
    // Auto-print is now optional and only triggers if explicitly enabled
    // The modal will show immediately, but printing is user-initiated for better UX
    if (autoPrint && printRef.current && autoDownload) {
      // Small delay to ensure content is rendered, then auto-print
      const timer = setTimeout(() => {
        handlePrint()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [autoPrint, autoDownload])

  // Order type labels – must match ExecutionOrdersSidebar and OrderDetailsModal
  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'dine-in':
        return 'Dine in'
      case 'take-away':
        return 'Takeaway'
      case 'delivery':
        return 'Delivery'
      default:
        return type
    }
  }

  // Format date and time
  const formatDateTime = (date: Date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  }

  // Only show values from place order API response (order_no, order_id) – no client-side generation
  const displayOrderNumber = (order.orderNumber ?? order.id) || '—'
  const orderIdDisplay = order.id || '—'
  const tableDisplay = order.tableName ?? (order.tableId ? `Table ${order.tableId}` : null) ?? 'None'

  // Status labels – same as ExecutionOrdersSidebar
  const STATUS_LABELS: Record<Order['status'], string> = {
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const handleClose = () => {
    setShowModal(false)
    if (onPrintComplete) {
      onPrintComplete()
    }
  }

  if (!showModal) return null

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        {/* Modal Content */}
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Kitchen Order Ticket</h2>
              <p className="text-sm text-green-50 mt-1">Order #{displayOrderNumber}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Print styles */}
          <style jsx global>{`
            @media print {
              @page {
                margin: 0;
                size: auto;
              }
              body * {
                visibility: hidden;
              }
              .kot-print-container,
              .kot-print-container * {
                visibility: visible;
              }
              .kot-print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
              .kot-modal-overlay {
                display: none !important;
              }
            }
          `}</style>
          
          {/* Receipt Content - Visible in modal, hidden for print */}
          <div 
            ref={printRef} 
            className="kot-print-container bg-white p-6"
          >
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
              <h1 className="text-2xl font-bold mb-2 text-gray-800">COCINA: Kitchen</h1>
              <p className="text-sm text-gray-500">Kitchen Order Ticket</p>
            </div>

            {/* Order Details – same order and labels as Execution orders sidebar; real order number & id from API */}
            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Client:</span>
                <span className="text-gray-900 font-medium">{order.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Order #:</span>
                <span className="font-mono font-bold text-gray-900">{displayOrderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Order ID:</span>
                <span className="font-mono font-medium text-gray-900">{orderIdDisplay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Order Type:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getOrderTypeLabel(order.orderType)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Table:</span>
                <span className="font-medium text-gray-900">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{tableDisplay}</span>
                </span>
              </div>
              {order.waiter && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Waiter:</span>
                  <span className="text-gray-900 font-medium">{order.waiter}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Status:</span>
                <span className={`shrink-0 px-2 py-1 rounded text-xs font-semibold uppercase ${
                  order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                  order.status === 'served' ? 'bg-violet-100 text-violet-800' :
                  order.status === 'completed' ? 'bg-neutral-100 text-neutral-600' :
                  'bg-red-100 text-red-800'
                }`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Date & Time:</span>
                <span className="text-gray-600 text-sm">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

            {/* Items List */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Order Items:</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const itemPrice = item.price + (item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0)
                  return (
                    <div key={item.lineItemId || `${item.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {item.name}
                              {item.selectedSize && <span className="text-gray-600 font-normal"> ({item.selectedSize})</span>}
                            </span>
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-xs text-gray-600 mt-2 ml-8 space-y-1">
                              {item.modifiers.map((mod, modIndex) => (
                                <div key={modIndex} className="flex items-center gap-1">
                                  <span className="text-green-600">+</span>
                                  <span>{mod.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-gray-600 mt-2 ml-8 italic bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                              📝 Note: {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm">
                          {item.quantity}x
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Action Buttons (only visible on screen, not in print) */}
          <div className="no-print sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-xl">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                    Print KOT
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              💡 Tip: Disable headers/footers in print settings for best results
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
