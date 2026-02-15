'use client'

import { useState, useMemo } from 'react'
import type { Order, Table } from '@/types/pos'

// Area theme: Garden (sky), Hall (rose)
const GARDEN_THEME = {
  unselected:
    'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 hover:border-sky-300',
  selected:
    'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/40',
}
const HALL_THEME = {
  unselected:
    'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 hover:border-rose-300',
  selected:
    'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/40',
}
const ALL_THEME = {
  unselected:
    'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100 hover:border-neutral-300',
  selected:
    'bg-[#1A73E8] text-white border-[#1A73E8] shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40',
}

function getAreaTheme(area: string) {
  const a = area.toLowerCase()
  if (a === 'garden') return GARDEN_THEME
  if (a === 'hall') return HALL_THEME
  return ALL_THEME
}

const GardenIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V14m-2 0h4M12 10a3 3 0 110 6 3 3 0 010-6z" />
  </svg>
)
const HallIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

interface ExecutionOrdersSidebarProps {
  orders: Order[]
  selectedOrderId: string | null
  onSelectOrder: (orderId: string | null) => void
  onRefresh: () => void
  onClose?: () => void
  /** Optional tables to show area (Garden/Hall) on section tiles. */
  tables?: Table[]
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

/** Normalize table key for grouping (tableName or tableId or 'No table') */
function getOrderTableKey(order: Order): string {
  const name = order.tableName?.trim()
  const id = order.tableId?.trim()
  if (name) return name
  if (id) return id
  return 'No table'
}

/** Format table key for display (table no, e.g. "Table 5"). */
function getTableDisplayLabel(key: string): string {
  if (!key || key === 'No table') return 'No table'
  if (/^\d+$/.test(key.trim())) return `Table ${key.trim()}`
  return key
}

/** Resolve area for an order using tables (match by table id/name). */
function getAreaForOrder(order: Order, tables: Table[]): string {
  const key = getOrderTableKey(order)
  const table = tables.find((t) => {
    if (t.name && key && (t.name === key || t.name.toLowerCase() === key.toLowerCase())) return true
    if (t.id && key && t.id === key) return true
    const keyNum = key.replace(/\D/g, '')
    const tNum = (t.name ?? t.id ?? '').replace(/\D/g, '')
    if (keyNum && tNum && keyNum === tNum) return true
    return false
  })
  return table?.area ?? 'Hall'
}

export default function ExecutionOrdersSidebar({
  orders,
  selectedOrderId,
  onSelectOrder,
  onRefresh,
  onClose,
  tables = [],
  onLoadOrderIntoCart,
  loadingOrderIntoCartId = null,
}: ExecutionOrdersSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  /** Selected section filter: table key or 'all' to show all running orders. */
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null)

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

  // Section tiles: one per table with running orders (area = Garden/Hall, tableNo = Table 5 etc.)
  const sectionTiles = useMemo(() => {
    const byKey = new Map<string, string>() // key -> area (first order wins)
    for (const order of runningOrders) {
      const key = getOrderTableKey(order)
      if (!byKey.has(key)) {
        const area = tables.length > 0 ? getAreaForOrder(order, tables) : '—'
        byKey.set(key, area)
      }
    }
    const list = Array.from(byKey.entries()).map(([key]) => ({
      key,
      area: byKey.get(key)!,
      tableNo: getTableDisplayLabel(key),
    }))
    return [{ key: 'all', area: 'All', tableNo: '' }, ...list]
  }, [runningOrders, tables])

  // Orders to show in list: filter by selected section when one is selected
  const ordersToShow = useMemo(() => {
    if (!selectedSectionKey || selectedSectionKey === 'all') return runningOrders
    return runningOrders.filter((o) => getOrderTableKey(o) === selectedSectionKey)
  }, [runningOrders, selectedSectionKey])

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
            <h2 className="text-sm sm:text-base font-bold text-neutral-800">Running orders</h2>
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

        {/* Section tiles grid (Garden / Hall themed) */}
        {sectionTiles.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {sectionTiles.map(({ key, area, tableNo }) => {
              const isSelected = (selectedSectionKey == null && key === 'all') || selectedSectionKey === key
              const theme = getAreaTheme(area)
              const isGarden = area.toLowerCase() === 'garden'
              const isHall = area.toLowerCase() === 'hall'
              const AreaIcon = isGarden ? GardenIcon : isHall ? HallIcon : null
              const themeClasses = isSelected ? theme.selected : theme.unselected
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedSectionKey(key === 'all' ? null : key)}
                  className={`min-h-[56px] flex flex-col items-center justify-center px-2 py-2 rounded-xl border-2 transition-all ${themeClasses}`}
                >
                  <span className="text-xs font-medium flex items-center gap-1">
                    {AreaIcon && <AreaIcon />}
                    {area}
                  </span>
                  {tableNo ? <span className="text-lg font-bold leading-tight mt-0.5">{tableNo}</span> : null}
                </button>
              )
            })}
          </div>
        )}

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
            <p>No running orders</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ordersToShow.map((order) => {
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
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-200'
                      : isNew
                        ? 'bg-sky-50/70 border-neutral-200 hover:border-sky-300 hover:shadow-sm'
                        : 'bg-white border-neutral-200 hover:border-sky-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-neutral-500 truncate">
                      {order.tableName || 'No table'} • {formatOrderNumber(order)}
                    </span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-900' :
                      order.status === 'preparing' ? 'bg-sky-100 text-sky-800' :
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
                      ID: <span className="font-bold">{order.id}</span>
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

      </div>
    </>
  )
}
