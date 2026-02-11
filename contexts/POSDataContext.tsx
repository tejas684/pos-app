'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  fetchProducts,
  fetchCategories,
  fetchWaiters,
  fetchCustomers,
  fetchDisplayOrders,
  normalizeOrderStatus,
  getOrderStatusFromApi,
  type ApiProduct,
  type ApiCategory,
  type ApiWaiter,
  type ApiCustomer,
  type ApiDisplayOrder,
} from '@/lib/api'
import type { Order, CartItem, OrderType } from '@/types/pos'
import { useAuth } from '@/contexts/AuthContext'

function mapApiOrderToOrder(api: ApiDisplayOrder): Order {
  const apiStatus = getOrderStatusFromApi(api)
  const status = normalizeOrderStatus(apiStatus)
  const orderType = (api.order_type ?? api.orderType ?? 'dine-in') as OrderType
  const tableNumber = api.table_number ?? api.tableName ?? (api.tableId != null ? String(api.tableId) : undefined)
  const tableName = tableNumber ? (String(tableNumber).match(/^table\s+/i) ? tableNumber : `Table ${tableNumber}`) : undefined
  const rawItems = Array.isArray(api.items) ? api.items : Array.isArray((api as Record<string, unknown>).order_items) ? (api as Record<string, unknown>).order_items as unknown[] : []
  const items: CartItem[] = rawItems.length > 0
    ? (rawItems as unknown[]).map((it: unknown, i: number) => {
        const x = it as Record<string, unknown>
        const productObj = x?.product && typeof x.product === 'object' ? (x.product as Record<string, unknown>) : null
        const name = String(
          x?.product_name ?? x?.name ?? x?.productName ?? x?.item_name ?? x?.title
          ?? productObj?.name ?? productObj?.product_name ?? productObj?.title ?? ''
        ).trim()
        const qty = Number(x?.quantity ?? 1) || 1
        const unitPrice = Number(x?.price ?? x?.unit_price ?? 0)
        const totalPrice = Number(x?.total_price ?? 0)
        const price = unitPrice > 0 ? unitPrice : (qty > 0 && totalPrice > 0 ? totalPrice / qty : 0)
        return {
          id: String(x?.id ?? x?.product_id ?? ''),
          lineItemId: `line-api-${api.id}-${i}`,
          name: name || 'Item',
          price,
          quantity: qty,
          category: x?.category as string | undefined,
          image: x?.image as string | undefined,
          modifiers: Array.isArray(x?.modifiers) ? (x.modifiers as { name: string; price: number }[]) : undefined,
          notes: x?.notes as string | undefined,
          discount: x?.discount as number | undefined,
          discountType: (x?.discountType as 'percentage' | 'fixed') ?? 'percentage',
          selectedSize: (x?.size_name ?? x?.selectedSize) as string | undefined,
        }
      })
    : []
  const createdAt = (api.created_at ?? api.createdAt)
    ? new Date((api.created_at ?? api.createdAt) as string)
    : new Date()
  const total = Number(api.total_price ?? api.total ?? 0)
  return {
    id: String(api.id),
    orderNumber: api.order_no != null ? String(api.order_no) : undefined,
    tableId: tableNumber,
    tableName: tableName ?? (tableNumber ? `Table ${tableNumber}` : undefined),
    orderType,
    customer: String(api.customer ?? 'Walk-in Customer'),
    items,
    status,
    total,
    discount: api.discount != null ? Number(api.discount) : undefined,
    tax: api.tax != null ? Number(api.tax) : undefined,
    charge: api.charge != null ? Number(api.charge) : undefined,
    tips: api.tips != null ? Number(api.tips) : undefined,
    createdAt,
    waiter: api.waiter != null ? String(api.waiter) : undefined,
    payment: api.payment as Order['payment'] | undefined,
  }
}

interface POSDataState {
  products: ApiProduct[]
  categories: ApiCategory[]
  waiters: ApiWaiter[]
  customers: ApiCustomer[]
  displayOrders: Order[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const defaultState: POSDataState = {
  products: [],
  categories: [],
  waiters: [],
  customers: [],
  displayOrders: [],
  isLoading: true,
  error: null,
  refetch: async () => {},
}

const POSDataContext = createContext<POSDataState>(defaultState)

export function POSDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth()
  const [state, setState] = useState<POSDataState>(defaultState)

  const load = useCallback(async () => {
    if (!token) {
      setState((s) => ({ ...s, products: [], categories: [], waiters: [], customers: [], displayOrders: [], isLoading: false, error: null }))
      return
    }
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const [products, categories, waiters, customers, displayOrdersRaw] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchWaiters(),
        fetchCustomers(),
        fetchDisplayOrders(),
      ])
      const displayOrders = displayOrdersRaw.map(mapApiOrderToOrder)
      if (typeof window !== 'undefined' && displayOrdersRaw.length > 0) {
        const first = displayOrdersRaw[0] as Record<string, unknown>
        const statusVal = getOrderStatusFromApi(displayOrdersRaw[0])
        console.log('[POS] Orders from API – first order status debug:', {
          keys: Object.keys(first),
          status: first.status,
          order_status: first.order_status,
          orderStatus: first.orderStatus,
          extracted: statusVal,
          normalized: displayOrders[0]?.status,
        })
      }
      setState((prev) => ({
        ...prev,
        products,
        categories,
        waiters,
        customers,
        displayOrders,
        isLoading: false,
        error: null,
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load POS data'
      setState((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }))
    }
  }, [token])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setState((s) => ({ ...s, isLoading: false, products: [], categories: [], waiters: [], customers: [], displayOrders: [] }))
      return
    }
    load()
  }, [isAuthenticated, token, load])

  const refetch = useCallback(async () => {
    await load()
  }, [load])

  const value: POSDataState = {
    ...state,
    refetch,
  }

  return <POSDataContext.Provider value={value}>{children}</POSDataContext.Provider>
}

export function usePOSData() {
  const ctx = useContext(POSDataContext)
  if (!ctx) {
    throw new Error('usePOSData must be used within POSDataProvider')
  }
  return ctx
}
