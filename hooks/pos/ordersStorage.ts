/**
 * Load/save orders to localStorage (used by usePOSOrders).
 */

import type { Order } from '@/types/pos'
import { POS_ORDERS_KEY } from './constants'

export function loadOrdersFromStorage(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(POS_ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Order[]
    return parsed.map((o) => ({
      ...o,
      createdAt: new Date(o.createdAt),
    }))
  } catch {
    return []
  }
}

export function saveOrdersToStorage(orders: Order[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(POS_ORDERS_KEY, JSON.stringify(orders))
  } catch (e) {
    console.error('Failed to persist orders:', e)
  }
}
