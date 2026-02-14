'use client'

import { useState, useMemo } from 'react'
import type { Order } from '@/types/pos'

interface ExecutionOrdersSidebarProps {
  orders: Order[]
  selectedOrderId: string | null
  onSelectOrder: (orderId: string | null) => void
  onRefresh: () => void
  onOrderDetails: (order: Order) => void
  onReprintKOT: (order: Order) => void
  onInvoice: (order: Order) => void
  onCancelOrder: (order: Order) => void
  onClose?: () => void
  /** When true, Order Details button is disabled and shows loading (fetching details from API). */
  orderDetailsLoading?: boolean
  /** Load order into cart (table, customer, waiter, items). Called when user clicks an order or "Load to cart". */
  onLoadOrderIntoCart?: (order: Order) => void | Promise<void>
  /** Order ID currently being loaded into cart (show spinner on that card). */
  loadingOrderIntoCartId?: string | null
}

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function getStatusLabel(status: Order['status']): string {
  return STATUS_LABELS[status] ?? status ?? 'Pending'
}

export default function ExecutionOrdersSidebar({
  orders,
  selectedOrderId,
  onSelectOrder,
  onRefresh,
  onOrderDetails,
  onReprintKOT,
  onInvoice,
  onCancelOrder,
  onClose,
  orderDetailsLoading = false,
  onLoadOrderIntoCart,
  loadingOrderIntoCartId = null,
}: ExecutionOrdersSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders

    const query = searchQuery.toLowerCase()
    return orders.filter(order => {
      const tableMatch = order.tableName?.toLowerCase().includes(query)
      const orderMatch = order.id.toLowerCase().includes(query)
      const orderNoMatch = order.orderNumber?.toLowerCase().includes(query)
      const waiterMatch = order.waiter?.toLowerCase().includes(query)
      const customerMatch = order.customer.toLowerCase().includes(query)
      return tableMatch || orderMatch || orderNoMatch || waiterMatch || customerMatch
    })
  }, [orders, searchQuery])

  // Get running orders (exclude completed and cancelled)
  const runningOrders = useMemo(() => {
    return filteredOrders.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
  }, [filteredOrders])

  const selectedOrder = useMemo(() => {
    return runningOrders.find(order => order.id === selectedOrderId) || null
  }, [runningOrders, selectedOrderId])

  // Show order number: prefer orderNumber from API (e.g. ORD-977810); fallback to id; format legacy client ids
  const formatOrderNumber = (order: Order) => {
    const raw = order.orderNumber ?? order.id
    if (!raw || !raw.startsWith('ORD-')) return raw
    const suffix = raw.replace('ORD-', '')
    if (!/^\d+$/.test(suffix)) return raw
    return raw
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

  // Check if an order is new (created within the last 5 minutes)
  const isNewOrder = (order: Order) => {
    const now = new Date()
    const orderDate = new Date(order.createdAt)
    const diffInMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60)
    return diffInMinutes <= 5
  }

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
      <div className="w-full max-w-full md:flex-shrink-0 flex flex-col bg-white border-r border-neutral-200 shadow-soft absolute md:relative inset-0 md:inset-auto z-40 md:z-auto h-full min-w-0">
        {/* Execution Orders Header */}
        <div className="px-3 py-2.5 border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-bold text-neutral-800">Execution orders</h2>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="md:hidden p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 transition-colors"
                  title="Close sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 transition-colors"
                title="Refresh orders"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Table, order number, waiter"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-800 placeholder-neutral-400 bg-white"
        />
      </div>

      {/* Order List Area */}
      <div className="flex-1 overflow-y-auto p-3 bg-neutral-50/50 min-h-0">
        {runningOrders.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-sm">
            <p>No execution orders</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {runningOrders.map((order) => {
              const isSelected = selectedOrderId === order.id
              const isNew = isNewOrder(order)
              const isLoadingIntoCart = loadingOrderIntoCartId === order.id
              const handleCardClick = () => {
                const nextSelected = isSelected ? null : order.id
                onSelectOrder(nextSelected)
                if (nextSelected && onLoadOrderIntoCart) {
                  void onLoadOrderIntoCart(order)
                }
              }
              return (
                <div
                  key={order.id}
                  onClick={handleCardClick}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? isNew
                        ? 'bg-primary-50 border-primary-400 shadow-md ring-2 ring-primary-200'
                        : 'bg-white border-primary-400 shadow-md ring-2 ring-primary-200'
                      : isNew
                        ? 'bg-primary-50/70 border-primary-200 hover:border-primary-400 hover:shadow-sm'
                        : 'bg-white border-neutral-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-neutral-500 truncate">
                      {order.tableName || 'No table'} • {formatOrderNumber(order)}
                    </span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'served' ? 'bg-violet-100 text-violet-800' :
                      order.status === 'completed' ? 'bg-neutral-100 text-neutral-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-neutral-800">
                      ID: {order.id}
                    </span>
                    {isLoadingIntoCart && (
                      <svg className="w-4 h-4 animate-spin text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {order.customer}
                    {order.items?.length != null && order.items.length > 0 && (
                      <span> • {order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {order.waiter && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Waiter: {order.waiter}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Action Buttons — one row, small */}
      <div className="px-2 py-1.5 border-t border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => selectedOrder && onOrderDetails(selectedOrder)}
            disabled={!selectedOrder || orderDetailsLoading}
            className="flex-1 min-w-0 flex items-center justify-center gap-0.5 px-1.5 py-1 bg-neutral-100 hover:bg-primary-50 hover:text-primary-700 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed text-neutral-700 rounded transition-colors font-medium text-[10px]"
            title="Order Details"
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
          <button
            onClick={() => selectedOrder && onReprintKOT(selectedOrder)}
            disabled={!selectedOrder}
            className="flex-1 min-w-0 flex items-center justify-center gap-0.5 px-1.5 py-1 bg-neutral-100 hover:bg-primary-50 hover:text-primary-700 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed text-neutral-700 rounded transition-colors font-medium text-[10px]"
            title="Reprint KOT"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="truncate">KOT</span>
          </button>
          <button
            onClick={() => selectedOrder && onInvoice(selectedOrder)}
            disabled={!selectedOrder}
            className="flex-1 min-w-0 flex items-center justify-center gap-0.5 px-1.5 py-1 bg-neutral-100 hover:bg-primary-50 hover:text-primary-700 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed text-neutral-700 rounded transition-colors font-medium text-[10px]"
            title="Invoice"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">Invoice</span>
          </button>
          <button
            onClick={() => selectedOrder && onCancelOrder(selectedOrder)}
            disabled={!selectedOrder}
            className="flex-1 min-w-0 flex items-center justify-center gap-0.5 px-1.5 py-1 bg-danger-50 hover:bg-danger-100 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed text-danger-700 rounded transition-colors font-medium text-[10px]"
            title="Cancel order"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Cancel</span>
          </button>
        </div>
      </div>
      </div>
    </>
  )
}
