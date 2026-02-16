'use client'

import { useState, useMemo } from 'react'
import type { Order, Table } from '@/types/pos'

type AreaTab = 'garden' | 'hall'

// Garden: emerald green (#33CC66) theme
const GARDEN_THEME = {
  tabUnselected:
    'bg-white/80 border-garden-200 text-garden-800 hover:bg-garden-50 hover:border-garden-300',
  tabSelected:
    'bg-garden-500 text-black border-garden-500 shadow-lg shadow-garden-500/30 ring-2 ring-garden-400/50',
  tileUnselected:
    'bg-garden-50 border-garden-200 text-garden-800 hover:bg-garden-100 hover:border-garden-300 hover:shadow-md',
  tileSelected:
    'bg-garden-500 text-black border-garden-500 shadow-lg shadow-garden-500/25 ring-2 ring-garden-400/40',
  panelBg: 'bg-gradient-to-b from-garden-50/80 to-white',
  emptyText: 'text-garden-700/90',
}

// Hall: warm amber/terracotta theme
const HALL_THEME = {
  tabUnselected:
    'bg-white/80 border-amber-200 text-amber-900 hover:bg-amber-50 hover:border-amber-300',
  tabSelected:
    'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50',
  tileUnselected:
    'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-400 hover:shadow-md',
  tileSelected:
    'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40',
  panelBg: 'bg-gradient-to-b from-amber-50/50 to-white',
  emptyText: 'text-amber-800/80',
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
  const [activeArea, setActiveArea] = useState<AreaTab>('garden')

  // Get running orders (exclude completed and cancelled)
  const runningOrders = useMemo(() => {
    return orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
  }, [orders])

  // Tiles grouped by area: Garden and Hall separately
  const { gardenTiles, hallTiles } = useMemo(() => {
    const byKey = new Map<string, string>() // key -> area
    for (const order of runningOrders) {
      const key = getOrderTableKey(order)
      if (!byKey.has(key)) {
        const area = tables.length > 0 ? getAreaForOrder(order, tables) : '—'
        byKey.set(key, area)
      }
    }
    const garden: { key: string; tableNo: string }[] = []
    const hall: { key: string; tableNo: string }[] = []
    for (const [key, area] of byKey.entries()) {
      const tile = { key, tableNo: getTableDisplayLabel(key) }
      if (area.toLowerCase() === 'garden') garden.push(tile)
      else hall.push(tile) // Hall + any unknown area
    }
    return { gardenTiles: garden, hallTiles: hall }
  }, [runningOrders, tables])

  const currentTiles = activeArea === 'garden' ? gardenTiles : hallTiles
  const theme = activeArea === 'garden' ? GARDEN_THEME : HALL_THEME
  const AreaIcon = activeArea === 'garden' ? GardenIcon : HallIcon
  const areaLabel = activeArea === 'garden' ? 'Garden' : 'Hall'

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

          {/* Garden / Hall area tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveArea('garden')}
              className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl border-2 font-semibold text-sm transition-all ${activeArea === 'garden' ? GARDEN_THEME.tabSelected : GARDEN_THEME.tabUnselected}`}
            >
              <GardenIcon />
              <span>Garden</span>
              {gardenTiles.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${activeArea === 'garden' ? 'bg-black/15 text-black' : 'bg-garden-200/70 text-garden-900'}`}>
                  {gardenTiles.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveArea('hall')}
              className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl border-2 font-semibold text-sm transition-all ${activeArea === 'hall' ? HALL_THEME.tabSelected : HALL_THEME.tabUnselected}`}
            >
              <HallIcon />
              <span>Hall</span>
              {hallTiles.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${activeArea === 'hall' ? 'bg-white/25' : 'bg-amber-200/70 text-amber-900'}`}>
                  {hallTiles.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Table tiles for selected area */}
        <div className={`flex-1 overflow-y-auto min-h-0 ${theme.panelBg}`}>
          {currentTiles.length > 0 ? (
            <div className="p-3">
              <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
                {areaLabel} tables
              </p>
              <div className="grid grid-cols-2 gap-2">
                {currentTiles.map(({ key, tableNo }) => {
                  const order = getOrderForTable(key, runningOrders)
                  const isSelected = selectedOrderId === order?.id
                  const isLoadingIntoCart = order && loadingOrderIntoCartId === order.id
                  const tileClasses = isSelected ? theme.tileSelected : theme.tileUnselected
                  const handleTileClick = () => {
                    if (!order || !onLoadOrderIntoCart) return
                    onSelectOrder(order.id)
                    void onLoadOrderIntoCart(order)
                  }
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={handleTileClick}
                      disabled={!order || !!loadingOrderIntoCartId}
                      className={`min-h-[64px] flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 transition-all relative disabled:opacity-70 disabled:cursor-not-allowed overflow-visible ${tileClasses} ${isSelected ? 'animate-live-glow shadow-lg' : ''}`}
                    >
                      {/* Animated "live" ring when selected */}
                      {isSelected && (
                        <span
                          className="absolute inset-0 rounded-xl border-2 border-current pointer-events-none animate-live-ring opacity-40"
                          aria-hidden
                        />
                      )}
                      <span className="text-lg font-bold leading-tight relative z-10">{tableNo}</span>
                      {isLoadingIntoCart && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 z-20">
                          <svg className="w-6 h-6 animate-spin text-current opacity-90" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className={`p-6 text-center text-sm ${theme.emptyText}`}>
              <AreaIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
              <p className="font-medium">No running orders</p>
              <p className="text-xs mt-0.5 opacity-90">in {areaLabel}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
