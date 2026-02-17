'use client'

import { useMemo } from 'react'
import type { Order, Table } from '@/types/pos'

// Garden: vibrant green – high visibility, outdoor
const GARDEN_THEME = {
  tileUnselected:
    'bg-green-200 border-2 border-green-600 text-black font-bold shadow-md hover:bg-green-300 hover:border-green-700 hover:shadow-lg active:scale-[0.98] transition-all duration-200',
  tileSelected:
    'bg-green-600 text-white border-2 border-green-800 shadow-lg shadow-green-500/40 ring-2 ring-green-400 font-bold',
  emptyBox: 'bg-green-100 border-2 border-green-400 text-green-900 font-medium',
}

// Hall: vibrant amber – high visibility, indoor
const HALL_THEME = {
  tileUnselected:
    'bg-amber-200 border-2 border-amber-600 text-black font-bold shadow-md hover:bg-amber-300 hover:border-amber-700 hover:shadow-lg active:scale-[0.98] transition-all duration-200',
  tileSelected:
    'bg-amber-600 text-white border-2 border-amber-800 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400 font-bold',
  emptyBox: 'bg-amber-100 border-2 border-amber-400 text-amber-900 font-medium',
}

const GardenIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const HallIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
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
  /** Load order into cart (table, customer, waiter, items). Called when user clicks a Garden/Hall/Table tile. */
  onLoadOrderIntoCart?: (order: Order) => void | Promise<void>
  /** Order ID currently being loaded into cart (show spinner on that tile). */
  loadingOrderIntoCartId?: string | null
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

/** Split for display: "Table" + number side by side */
function getTableDisplayParts(key: string): { label: string; number: string } {
  const full = getTableDisplayLabel(key)
  if (full === 'No table') return { label: 'No table', number: '' }
  const match = full.match(/^Table (.+)$/)
  if (match) return { label: 'Table', number: match[1] }
  return { label: full, number: '' }
}

/** Resolve area for an order using tables (match by table id/name) or order.area from API. */
function getAreaForOrder(order: Order, tables: Table[]): string {
  if (tables.length === 0) {
    return order.area?.trim() || 'Hall'
  }
  const key = getOrderTableKey(order)
  const table = tables.find((t) => {
    if (t.name && key && (t.name === key || t.name.toLowerCase() === key.toLowerCase())) return true
    if (t.id && key && t.id === key) return true
    const keyNum = key.replace(/\D/g, '')
    const tNum = (t.name ?? t.id ?? '').replace(/\D/g, '')
    if (keyNum && tNum && keyNum === tNum) return true
    return false
  })
  return table?.area ?? order.area?.trim() ?? 'Hall'
}

/** Get the most recent running order for a table (by createdAt). */
function getOrderForTable(tableKey: string, runningOrders: Order[]): Order | undefined {
  const forTable = runningOrders.filter((o) => getOrderTableKey(o) === tableKey)
  if (forTable.length === 0) return undefined
  return [...forTable].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime()
    const bTime = new Date(b.createdAt ?? 0).getTime()
    return bTime - aTime
  })[0]
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
  // Get running orders (exclude completed and cancelled)
  const runningOrders = useMemo(() => {
    return orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
  }, [orders])

  // Tiles grouped by area: Garden and Hall separately (both shown directly)
  const { gardenTiles, hallTiles } = useMemo(() => {
    const byKey = new Map<string, string>() // key -> area
    for (const order of runningOrders) {
      const key = getOrderTableKey(order)
      if (!byKey.has(key)) {
        const area = getAreaForOrder(order, tables)
        byKey.set(key, area)
      }
    }
    const garden: { key: string; tableNo: string }[] = []
    const hall: { key: string; tableNo: string }[] = []
    for (const [key, area] of byKey.entries()) {
      const tile = { key, tableNo: getTableDisplayLabel(key), parts: getTableDisplayParts(key) }
      if (area.toLowerCase() === 'garden') garden.push(tile)
      else hall.push(tile) // Hall + any unknown area
    }
    return { gardenTiles: garden, hallTiles: hall }
  }, [runningOrders, tables])

  return (
    <>
      {onClose && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
      <div className="w-full max-w-full md:flex-shrink-0 flex flex-col bg-white border-r border-neutral-200 shadow-soft absolute md:relative inset-0 md:inset-auto z-40 md:z-auto h-full min-w-0">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-bold text-neutral-800">Running orders</h2>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                  title="Close sidebar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="Refresh orders"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Garden and Hall orders – elegant tiles, single scroll */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="p-3 space-y-5">
            {/* Garden tables section */}
            <section>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="p-1.5 rounded-lg bg-green-200 border border-green-400 shadow-sm">
                  <GardenIcon className="w-4 h-4 text-green-700" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Garden Tables
                </h3>
              </div>
              {gardenTiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {gardenTiles.map(({ key, tableNo, parts }) => {
                    const order = getOrderForTable(key, runningOrders)
                    const isSelected = selectedOrderId === order?.id
                    const isLoadingIntoCart = order && loadingOrderIntoCartId === order.id
                    const theme = GARDEN_THEME
                    const tileClasses = isSelected ? theme.tileSelected : theme.tileUnselected
                    const handleTileClick = () => {
                      if (!order || !onLoadOrderIntoCart) return
                      onSelectOrder(order.id)
                      void onLoadOrderIntoCart(order)
                    }
                    return (
                      <button
                        key={`garden-${key}`}
                        type="button"
                        onClick={handleTileClick}
                        disabled={!order || !!loadingOrderIntoCartId}
                        className={`min-h-[52px] flex items-center justify-center px-4 py-3 rounded-xl border transition-all duration-200 relative disabled:opacity-60 disabled:cursor-not-allowed ${tileClasses} ${isSelected ? 'animate-live-glow' : ''}`}
                        title={tableNo}
                      >
                        {isSelected && (
                          <span
                            className="absolute inset-0 rounded-xl ring-2 ring-inset ring-white/30 pointer-events-none"
                            aria-hidden
                          />
                        )}
                        <span className="inline-flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap flex-shrink-0 relative z-10">
                          <span>{parts.label}</span>
                          {parts.number && <span className="text-sm font-extrabold [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]">{parts.number}</span>}
                        </span>
                        {isLoadingIntoCart && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-20">
                            <svg className="w-5 h-5 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className={`p-4 text-center rounded-xl text-sm font-medium ${GARDEN_THEME.emptyBox}`}>
                  <GardenIcon className="w-6 h-6 mx-auto mb-1.5 text-emerald-400" />
                  <p>No running orders in Garden</p>
                </div>
              )}
            </section>

            {/* Hall tables section */}
            <section>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="p-1.5 rounded-lg bg-amber-200 border border-amber-500 shadow-sm">
                  <HallIcon className="w-4 h-4 text-amber-800" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hall Tables
                </h3>
              </div>
              {hallTiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {hallTiles.map(({ key, tableNo, parts }) => {
                    const order = getOrderForTable(key, runningOrders)
                    const isSelected = selectedOrderId === order?.id
                    const isLoadingIntoCart = order && loadingOrderIntoCartId === order.id
                    const theme = HALL_THEME
                    const tileClasses = isSelected ? theme.tileSelected : theme.tileUnselected
                    const handleTileClick = () => {
                      if (!order || !onLoadOrderIntoCart) return
                      onSelectOrder(order.id)
                      void onLoadOrderIntoCart(order)
                    }
                    return (
                      <button
                        key={`hall-${key}`}
                        type="button"
                        onClick={handleTileClick}
                        disabled={!order || !!loadingOrderIntoCartId}
                        className={`min-h-[52px] flex items-center justify-center px-4 py-3 rounded-xl border transition-all duration-200 relative disabled:opacity-60 disabled:cursor-not-allowed ${tileClasses} ${isSelected ? 'animate-live-glow' : ''}`}
                        title={tableNo}
                      >
                        {isSelected && (
                          <span
                            className="absolute inset-0 rounded-xl ring-2 ring-inset ring-white/30 pointer-events-none"
                            aria-hidden
                          />
                        )}
                        <span className="inline-flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap flex-shrink-0 relative z-10">
                          <span>{parts.label}</span>
                          {parts.number && <span className="text-sm font-extrabold [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]">{parts.number}</span>}
                        </span>
                        {isLoadingIntoCart && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-20">
                            <svg className="w-5 h-5 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className={`p-4 text-center rounded-xl text-sm font-medium ${HALL_THEME.emptyBox}`}>
                  <HallIcon className="w-6 h-6 mx-auto mb-1.5 text-amber-400" />
                  <p>No running orders in Hall</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
