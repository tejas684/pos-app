/**
 * Proxy for display orders – fetches from external API and enriches each order
 * with customer_name. Tries: 1) customer_id lookup in customers list,
 * 2) fetching full order details when display API omits customer.
 */

import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demo.webwideit.solutions/pos-aishwarya/public'
const MAX_DETAIL_FETCHES = 15

function extractArray<T>(data: unknown, keys: string[]): T[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as T[]
  if (typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    const val = obj[key]
    if (Array.isArray(val)) return val as T[]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      if (Array.isArray(inner.data)) return inner.data as T[]
      if (Array.isArray(inner.orders)) return inner.orders as T[]
      if (Array.isArray(inner.customers)) return inner.customers as T[]
      // Extra nesting (e.g. { data: { orders: { data: [...] } } })
      const ordersOrData = inner.orders ?? inner.data
      if (ordersOrData && typeof ordersOrData === 'object' && Array.isArray((ordersOrData as Record<string, unknown>).data)) {
        return ((ordersOrData as Record<string, unknown>).data as T[])
      }
    }
  }
  return []
}

function getCustomerFullName(c: Record<string, unknown>): string {
  const first = String(c.name ?? c.first_name ?? c.firstName ?? '').trim()
  const last = String(c.last_name ?? c.lastName ?? c.lastname ?? '').trim()
  return [first, last].filter(Boolean).join(' ') || first || String(c.id ?? '')
}

/** Extract customer name from order details API response */
function extractCustomerFromDetailsResponse(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null
  const r = res as Record<string, unknown>
  const data = r.data as Record<string, unknown> | undefined
  const raw = (data?.order ?? data ?? r) as Record<string, unknown>
  const custStr = typeof raw.customer === 'string' ? raw.customer : null
  if (custStr && custStr.trim()) return custStr.trim()
  if (raw.customer_name != null && String(raw.customer_name).trim()) return String(raw.customer_name).trim()
  const custObj = raw.customer
  if (custObj && typeof custObj === 'object' && !Array.isArray(custObj)) {
    const name = getCustomerFullName(custObj as Record<string, unknown>)
    if (name) return name
  }
  return null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  }

  try {
    const [ordersRes, customersRes] = await Promise.all([
      fetch(`${BASE_URL.replace(/\/$/, '')}/api/admin/orders/display`, { headers }),
      fetch(`${BASE_URL.replace(/\/$/, '')}/api/customers`, { headers }),
    ])

    if (!ordersRes.ok) {
      return NextResponse.json(
        { message: ordersRes.statusText || 'Failed to fetch orders' },
        { status: ordersRes.status }
      )
    }

    const ordersData = await ordersRes.json()
    let orders = extractArray<Record<string, unknown>>(ordersData, ['data', 'orders'])
    if (orders.length === 0 && Array.isArray(ordersData)) orders = ordersData as Record<string, unknown>[]

    const customersData = customersRes.ok ? await customersRes.json() : {}
    const customers = extractArray<Record<string, unknown>>(customersData, ['data', 'customers', 'items', 'result'])

    let enrichedOrders = orders.map((order) => {
      const raw = order as Record<string, unknown>
      const hasCustomer = typeof raw.customer === 'string' && String(raw.customer).trim()
      const hasCustomerName = raw.customer_name != null && String(raw.customer_name).trim()
      const hasCustomerNameCamel = raw.customerName != null && String(raw.customerName).trim()
      if (hasCustomer || hasCustomerName || hasCustomerNameCamel) return order

      let customerId = raw.customer_id ?? raw.customerId ?? raw.user_id ?? raw.guest_id
      const custObj = raw.customer ?? raw.Customer
      if (customerId == null && custObj && typeof custObj === 'object' && !Array.isArray(custObj)) {
        const o = custObj as Record<string, unknown>
        customerId = o.id ?? o.customer_id ?? o.customerId
      }

      if (customerId != null && customers.length > 0) {
        const idStr = String(customerId)
        const match = customers.find((c) =>
          String(c.id ?? c.customer_id ?? c.customerId ?? c.pk) === idStr
        )
        if (match) {
          const name = getCustomerFullName(match)
          return { ...order, customer: name, customer_name: name, customerName: name }
        }
      }

      return order
    })

    // Fetch order details for orders still missing customer (display API often omits it)
    const needsDetails = enrichedOrders
      .map((o, i) => ({ order: o, index: i }))
      .filter(({ order }) => {
        const r = order as Record<string, unknown>
        return !(
          (typeof r.customer === 'string' && String(r.customer).trim()) ||
          (r.customer_name != null && String(r.customer_name).trim())
        )
      })
      .slice(0, MAX_DETAIL_FETCHES)

    if (needsDetails.length > 0) {
      const detailResults = await Promise.allSettled(
        needsDetails.map(({ order }) => {
          const id = (order as Record<string, unknown>).id ?? (order as Record<string, unknown>).order_id
          return fetch(
            `${BASE_URL.replace(/\/$/, '')}/api/orders/details/${encodeURIComponent(String(id))}`,
            { headers }
          ).then((res) => (res.ok ? res.json() : null))
        })
      )

      for (let i = 0; i < needsDetails.length; i++) {
        const { order } = needsDetails[i]
        const result = detailResults[i]
        if (result.status === 'fulfilled' && result.value) {
          const customerName = extractCustomerFromDetailsResponse(result.value)
          if (customerName) {
            const origIndex = enrichedOrders.findIndex((o) => (o as Record<string, unknown>).id === (order as Record<string, unknown>).id)
            if (origIndex >= 0) {
              enrichedOrders = enrichedOrders.map((o, idx) =>
                idx === origIndex
                  ? { ...o, customer: customerName, customer_name: customerName, customerName: customerName }
                  : o
              )
            }
          }
        }
      }
    }

    const responseShape = Array.isArray(ordersData)
      ? enrichedOrders
      : typeof ordersData === 'object' && ordersData !== null
        ? { ...(ordersData as object), data: enrichedOrders }
        : { data: enrichedOrders }

    return NextResponse.json(responseShape)
  } catch (err) {
    console.error('[display-orders] Proxy error:', err)
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Proxy failed' },
      { status: 500 }
    )
  }
}
