/**
 * Orders and tables state, persistence, and sync for POS.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Order, Table } from '@/types/pos'
import { fetchTables as fetchTablesApi } from '@/lib/api/pos'
import { STALE_ORDER_HOURS } from './constants'
import { loadOrdersFromStorage, saveOrdersToStorage } from './ordersStorage'

export function usePOSOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const ordersLoadedRef = useRef(false)
  const [tables, setTables] = useState<Table[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return
    let cancelled = false
    fetchTablesApi()
      .then((list) => {
        if (!cancelled && list.length > 0) {
          setTables(list)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isMounted])

  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted || ordersLoadedRef.current) return
    const stored = loadOrdersFromStorage()
    const staleCutoff = Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000
    const cleaned = stored.map((o) => {
      if (o.status !== 'completed' && o.status !== 'cancelled' && o.createdAt.getTime() < staleCutoff) {
        return { ...o, status: 'completed' as const }
      }
      return o
    })
    if (cleaned.length > 0) {
      setOrders(cleaned)
    }
    ordersLoadedRef.current = true
  }, [isMounted])

  useEffect(() => {
    if (typeof window === 'undefined' || !ordersLoadedRef.current) return
    saveOrdersToStorage(orders)
  }, [orders])

  const setOrdersFromApi = useCallback((apiOrders: Order[]) => {
    setOrders(apiOrders)
  }, [])

  useEffect(() => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        const isActive = (o: Order) => o.status !== 'completed' && o.status !== 'cancelled'
        const matchesTable = (order: Order) => {
          if (order.tableId && table.id && order.tableId === table.id) return true
          if (order.tableName && table.name && order.tableName === table.name) return true
          if (order.tableName && table.name) {
            const orderNum = order.tableName.replace(/[^0-9]/g, '')
            const tableNum = table.name.replace(/[^0-9]/g, '')
            if (orderNum && tableNum && orderNum === tableNum) return true
          }
          return false
        }
        const activeOrder = orders.find((o) => isActive(o) && matchesTable(o))
        if (activeOrder) {
          return { ...table, status: 'occupied' as const, currentOrderId: activeOrder.id }
        }
        return { ...table, status: 'available' as const, currentOrderId: undefined }
      })
    )
  }, [orders])

  return {
    orders,
    setOrders,
    tables,
    setTables,
    setOrdersFromApi,
    isMounted,
  }
}
