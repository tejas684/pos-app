/**
 * POS APIs – products, categories, waiters, customers, orders (display), tables.
 * All require Authorization token after login.
 */

import { apiGet, apiPost, apiPut } from './client'
import type { Table, Order, CartItem, OrderType } from '@/types/pos'

/** Product from /api/admin/all-products – API may use different keys; we normalize to this shape */
export interface ApiProduct {
  id: string
  name: string
  price: number
  category?: string
  category_id?: string
  image?: string
  sizes?: { id: string; name: string; price: number }[]
  modifiers?: { id: string; name: string; price: number }[]
  [key: string]: unknown
}

/** Extract array from various API response shapes (response = array, or { data: [] }, { data: { products: [] } }, etc.) */
function extractArray<T>(data: unknown, keys: string[]): T[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as T[]
  if (typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    let val = obj[key]
    if (Array.isArray(val)) return val as T[]
    // Nested: e.g. { data: { products: [] } }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      if (Array.isArray(inner.data)) return inner.data as T[]
      if (Array.isArray(inner.products)) return inner.products as T[]
      if (Array.isArray(inner.categories)) return inner.categories as T[]
      if (Array.isArray(inner.customers)) return inner.customers as T[]
      if (Array.isArray(inner.items)) return inner.items as T[]
    }
  }
  return []
}

/** Get category name from API (may be string or object like { id, name }) */
function getCategoryName(o: Record<string, unknown>): string | undefined {
  const cat = o.category ?? o.category_name ?? o.category_id
  if (typeof cat === 'string') return cat || undefined
  if (cat && typeof cat === 'object' && 'name' in cat) return String((cat as { name: unknown }).name)
  if (cat && typeof cat === 'object' && 'id' in cat) return String((cat as { id: unknown }).id)
  return undefined
}

/** Normalize a raw product from API to ApiProduct (handles different field names) */
function normalizeProduct(raw: unknown): ApiProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id ?? o.product_id ?? o.productId ?? o.pk
  const name = String(o.name ?? o.product_name ?? o.productName ?? o.title ?? o.item_name ?? '')
  const price = Number(o.price ?? o.selling_price ?? o.sale_price ?? o.amount ?? o.unit_price ?? 0)
  if (id == null) return null
  return {
    id: String(id),
    name: name.trim() || 'Product',
    price: Number.isNaN(price) ? 0 : price,
    category: getCategoryName(o),
    category_id: o.category_id != null ? String(o.category_id) : undefined,
    image: (o.image ?? o.image_url ?? o.photo ?? o.thumbnail) as string | undefined,
    sizes: Array.isArray(o.sizes) ? (o.sizes as { id: string; name: string; price: number }[]) : undefined,
    modifiers: Array.isArray(o.modifiers) ? (o.modifiers as { id: string; name: string; price: number }[]) : undefined,
    ...o,
  }
}

/** Normalize a raw category from API to ApiCategory */
function normalizeCategory(raw: unknown): ApiCategory | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id ?? o.category_id ?? o.categoryId ?? o.pk
  const name = String(o.name ?? o.category_name ?? o.categoryName ?? o.title ?? '').trim() || 'Category'
  if (id == null) return null
  return { id: String(id), name, ...o }
}

/** Category from /api/admin/product-categories */
export interface ApiCategory {
  id: string
  name: string
  [key: string]: unknown
}

/** Waiter from /api/waiters */
export interface ApiWaiter {
  id: string
  name?: string
  [key: string]: unknown
}

/** Customer from /api/customers – may have name + last_name or single name */
export interface ApiCustomer {
  id: string
  name?: string
  last_name?: string
  phone?: string
  email?: string
  [key: string]: unknown
}

/** Normalize raw customer from API – extract name and last_name for dropdown full name display */
function normalizeApiCustomer(raw: unknown): ApiCustomer | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id ?? o.customer_id ?? o.customerId ?? o.pk
  if (id == null) return null

  // Prefer first_name + last_name when both exist (API often uses these)
  const apiFirstName = String(o.first_name ?? o.firstName ?? o.name ?? '').trim()
  const apiLastName = String(o.last_name ?? o.lastName ?? '').trim()
  const apiFullName = String(o.name ?? '').trim()

  let name: string
  let last_name: string
  if (apiFirstName && apiLastName) {
    name = apiFirstName
    last_name = apiLastName
  } else if (apiFullName && !apiFirstName && !apiLastName) {
    // Single "name" field with full name – split into first + last
    const parts = apiFullName.split(/\s+/)
    name = parts[0] ?? ''
    last_name = parts.slice(1).join(' ').trim()
  } else if (apiFirstName) {
    name = apiFirstName
    last_name = apiLastName
  } else {
    name = apiFullName || ''
    last_name = ''
  }

  const phone = o.phone ?? o.mobile ?? o.contact ?? o.contact_number
  const email = o.email

  return {
    ...o,
    id: String(id),
    name: name || undefined,
    last_name: last_name || undefined,
    phone: phone != null ? String(phone) : undefined,
    email: email != null ? String(email) : undefined,
  }
}

/** Build full name for dropdown display – use consistently across app */
export function getApiCustomerFullName(c: ApiCustomer): string {
  const first = (c.name ?? '').trim()
  const last = (c.last_name ?? (c as Record<string, unknown>).lastName ?? (c as Record<string, unknown>).lastname ?? '').trim()
  return [first, last].filter(Boolean).join(' ').trim() || first || String(c.id ?? '—')
}

/** Order from /api/admin/orders/display – list API returns id, order_no, table_number, order_type, items_count, total_price, status, created_at */
export interface ApiDisplayOrder {
  id: number | string
  order_no?: string
  table_number?: string
  tableId?: string
  tableName?: string
  order_type?: string
  orderType?: string
  items_count?: number
  total_price?: number
  total?: number
  customer?: string
  items?: unknown[]
  /** Status from API – may also appear as order_status or orderStatus */
  status?: string
  order_status?: string
  orderStatus?: string
  created_at?: string
  createdAt?: string
  discount?: number
  tax?: number
  charge?: number
  tips?: number
  waiter?: string
  [key: string]: unknown
}

/** Normalize API status (string or number) to app Order status (for display in execution panel). */
export function normalizeOrderStatus(apiStatus: string | number | undefined): 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' {
  if (apiStatus === undefined || apiStatus === null) return 'pending'
  const raw = String(apiStatus).trim().toLowerCase()
  if (!raw) return 'pending'
  // Numeric codes (common in backends: 0=pending, 1=preparing, 2=ready, 3=served, 4=completed, 5=cancelled)
  const num = Number(apiStatus)
  if (!Number.isNaN(num)) {
    if (num === 5 || num === 6) return 'cancelled'
    if (num === 4) return 'completed'
    if (num === 3) return 'served'
    if (num === 2) return 'ready'
    if (num === 1) return 'preparing'
    if (num === 0) return 'pending'
  }
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled'
  if (raw === 'completed' || raw === 'paid' || raw === 'closed') return 'completed'
  if (raw === 'preparing' || raw === 'in_progress' || raw === 'in-progress' || raw === 'processing' || raw === 'cooking') return 'preparing'
  if (raw === 'ready' || raw === 'ready_for_pickup') return 'ready'
  if (raw === 'served' || raw === 'delivered' || raw === 'out_for_delivery') return 'served'
  if (raw === 'pending' || raw === 'placed' || raw === 'order_placed' || raw === 'new' || raw === 'active' || raw === 'confirmed') return 'pending'
  return 'pending'
}

/** Get raw status value from API order (checks multiple keys and nested objects). */
export function getOrderStatusFromApi(api: ApiDisplayOrder): string | number | undefined {
  const o = api as Record<string, unknown>
  const keys = ['status', 'order_status', 'orderStatus', 'state', 'order_state', 'orderState', 'status_name', 'order_status_name', 'current_status']
  for (const key of keys) {
    const val = o[key]
    if (val === undefined || val === null) continue
    if (typeof val === 'string' && val.trim()) return val
    if (typeof val === 'number') return val
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>
      const name = obj.name ?? obj.label ?? obj.value ?? obj.title
      if (name != null && String(name).trim()) return String(name)
    }
  }
  return undefined
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  try {
    const data = await apiGet<unknown>('api/admin/all-products')
    const rawList = extractArray(data, ['data', 'products', 'items', 'result'])
    const list: ApiProduct[] = []
    for (const item of rawList) {
      const normalized = normalizeProduct(item)
      if (normalized) list.push(normalized)
    }
    return list
  } catch {
    return []
  }
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const data = await apiGet<unknown>('api/admin/all-categories')
    const rawList = extractArray(data, ['data', 'categories', 'items', 'result'])
    const list: ApiCategory[] = []
    for (const item of rawList) {
      const normalized = normalizeCategory(item)
      if (normalized) list.push(normalized)
    }
    return list
  } catch {
    return []
  }
}

export async function fetchWaiters(): Promise<ApiWaiter[]> {
  const data = await apiGet<{ data?: ApiWaiter[]; waiters?: ApiWaiter[] } | ApiWaiter[]>(
    'api/waiters'
  )
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { data?: ApiWaiter[] }).data)) {
    return (data as { data: ApiWaiter[] }).data
  }
  if (data && typeof data === 'object' && Array.isArray((data as { waiters?: ApiWaiter[] }).waiters)) {
    return (data as { waiters: ApiWaiter[] }).waiters
  }
  return []
}

export async function fetchCustomers(): Promise<ApiCustomer[]> {
  try {
    const data = await apiGet<unknown>('api/customers')
    const rawList = extractArray(data, ['data', 'customers', 'items', 'result'])
    return rawList.map(normalizeApiCustomer).filter((c): c is ApiCustomer => c != null)
  } catch {
    return []
  }
}

/** Request body for adding a store customer – only name and mobile */
export interface CreateStoreCustomerRequest {
  name: string
  mobile: string
}

/** Response from POST api/store/customers – may return { data: { id, name, last_name, mobile } } or similar */
export interface CreateStoreCustomerResponse {
  data?: { id?: string | number; name?: string; last_name?: string; mobile?: string; [key: string]: unknown }
  message?: string
  [key: string]: unknown
}

/** Add a customer via store API. POST api/store/customers with { name, mobile }. */
export async function createStoreCustomer(
  body: CreateStoreCustomerRequest
): Promise<CreateStoreCustomerResponse> {
  const requestBody = {
    name: body.name.trim(),
    mobile: body.mobile.trim(),
  }
  return apiPost<CreateStoreCustomerResponse>('api/store/customers', requestBody)
}

/** Response from PUT api/update/customers/:id */
export interface UpdateStoreCustomerResponse {
  data?: { id?: string | number; name?: string; last_name?: string; mobile?: string; [key: string]: unknown }
  message?: string
  [key: string]: unknown
}

/** Update a customer via store API. PUT api/update/customers/:id with { name, mobile }. */
export async function updateStoreCustomer(
  customerId: string,
  body: CreateStoreCustomerRequest
): Promise<UpdateStoreCustomerResponse> {
  const requestBody = {
    name: body.name.trim(),
    mobile: body.mobile.trim(),
  }
  return apiPut<UpdateStoreCustomerResponse>(`api/update/customers/${encodeURIComponent(customerId)}`, requestBody)
}

export async function fetchDisplayOrders(): Promise<ApiDisplayOrder[]> {
  const data = await apiGet<{ data?: ApiDisplayOrder[]; orders?: ApiDisplayOrder[] } | ApiDisplayOrder[]>(
    'api/admin/orders/display'
  )
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { data?: ApiDisplayOrder[] }).data)) {
    return (data as { data: ApiDisplayOrder[] }).data
  }
  if (data && typeof data === 'object' && Array.isArray((data as { orders?: ApiDisplayOrder[] }).orders)) {
    return (data as { orders: ApiDisplayOrder[] }).orders
  }
  return []
}

/** Raw table from /api/admin/tables – API may use different keys */
export interface ApiTable {
  id: string
  name?: string
  capacity?: number
  status?: string
  area?: string
  x?: number
  y?: number
  [key: string]: unknown
}

/** Normalize a raw table from API to Table shape (id, name, capacity, status, x, y, area) */
function normalizeTable(raw: unknown): Table | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id ?? o.table_id ?? o.pk
  const tableNumber = o.table_number ?? o.number ?? o.name ?? o.table_name ?? o.tableName ?? o.label ?? id
  const name = String(tableNumber).trim() ? `Table ${String(tableNumber).trim()}` : `Table ${id}`
  const capacity = Number(o.seat_capacity ?? o.capacity ?? o.seats ?? o.chairs ?? 4)
  const statusRaw = String(o.status ?? o.availability ?? 'available').toLowerCase()
  const status = statusRaw === 'occupied' || statusRaw === 'booked' ? 'occupied' : statusRaw === 'reserved' ? 'reserved' : 'available'
  const x = Number(o.x ?? o.position_x ?? 0)
  const y = Number(o.y ?? o.position_y ?? 0)
  const area = o.area_floor != null ? String(o.area_floor) : (o.area != null ? String(o.area) : o.floor != null ? String(o.floor) : undefined)
  if (id == null) return null
  return {
    id: String(id),
    name,
    capacity: Number.isNaN(capacity) ? 4 : Math.max(1, capacity),
    status: status as 'available' | 'occupied' | 'reserved',
    x: Number.isNaN(x) ? 0 : x,
    y: Number.isNaN(y) ? 0 : y,
    ...(area ? { area: area.trim() || undefined } : {}),
  }
}

/** Fetch tables from API (used when app runs). Handles { status, data: { user, tables: [...] } } shape. */
export async function fetchTables(): Promise<Table[]> {
  try {
    const data = await apiGet<unknown>('api/admin/tables')
    let rawList: unknown[] = []
    if (data && typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>
      const inner = obj.data as Record<string, unknown> | undefined
      if (inner && typeof inner === 'object' && Array.isArray(inner.tables)) {
        rawList = inner.tables
      } else {
        rawList = extractArray(data, ['data', 'tables', 'items', 'result'])
      }
    }
    const list: Table[] = []
    for (const item of rawList) {
      const normalized = normalizeTable(item)
      if (normalized) list.push(normalized)
    }
    return list
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Place Order API
// ---------------------------------------------------------------------------

export interface PlaceOrderCartItem {
  product_id: number
  product_name: string
  size_id: number | null
  size_name: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface PlaceOrderRequest {
  customer_id: number
  waiter_id: number
  order_type: 'dine-in' | 'take-away' | 'delivery'
  areas: string
  table_number: string
  selected_persons: string
  price_per_person: string
  total_charge: number
  delivery_partner: string | null
  total_price: number
  cart: PlaceOrderCartItem[]
}

/** API response shape – normalize in app to Order type */
export interface PlaceOrderResponseOrder {
  id?: number | string
  order_number?: string
  order_id?: string
  table_number?: string
  table_name?: string
  table_id?: string
  order_type?: string
  customer_id?: number
  customer_name?: string
  waiter_id?: number
  waiter_name?: string
  total?: number
  total_price?: number
  discount?: number
  tax?: number
  charge?: number
  tips?: number
  status?: string
  created_at?: string
  items?: Array<{
    id?: number | string
    product_id?: number | string
    product_name?: string
    name?: string
    quantity?: number
    unit_price?: number
    price?: number
    size_id?: number | null
    size_name?: string | null
    total_price?: number
    [key: string]: unknown
  }>
  order_items?: Array<{
    id?: number | string
    product_id?: number | string
    product_name?: string
    name?: string
    quantity?: number
    unit_price?: number
    price?: number
    size_id?: number | null
    size_name?: string | null
    total_price?: number
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export interface PlaceOrderResponse {
  data?: PlaceOrderResponseOrder | { order?: PlaceOrderResponseOrder }
  order?: PlaceOrderResponseOrder
  message?: string
  /** Top-level success response: { success, order_id, order_no, message } */
  success?: boolean
  order_id?: number | string
  order_no?: string
  [key: string]: unknown
}

export async function placeOrderApi(body: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  return apiPost<PlaceOrderResponse>('api/pos/place/order', body)
}

// ---------------------------------------------------------------------------
// Cancel Order API
// ---------------------------------------------------------------------------

export interface CancelOrderRequest {
  reason: string
}

export interface CancelOrderResponse {
  message?: string
  data?: unknown
  [key: string]: unknown
}

/** Cancel an order via API. POST api/orders/:orderId/cancel with body { reason }. */
export async function cancelOrderApi(orderId: string, reason: string): Promise<CancelOrderResponse> {
  return apiPost<CancelOrderResponse>(`api/orders/${encodeURIComponent(orderId)}/cancel`, { reason })
}

// ---------------------------------------------------------------------------
// Update Order API (api/orders/:orderId/update)
// ---------------------------------------------------------------------------

export interface UpdateOrderCartItem {
  order_id: number
  product_id: number
  product_name: string
  size_id: number | null
  size_name: string | null
  quantity: number
  total_price: number
}

export interface UpdateOrderRequest {
  customer_id: number
  waiter_id: number
  order_type: 'dine-in' | 'take-away' | 'delivery'
  areas: string
  table_number: string
  selected_persons: string
  price_per_person: string
  total_charge: string
  total_price: string
  cart: UpdateOrderCartItem[]
}

export interface UpdateOrderResponse {
  message?: string
  data?: unknown
  [key: string]: unknown
}

/** Update an existing order. POST api/orders/:orderId/update with order body (customer, waiter, table, cart, etc.). */
export async function updateOrderApi(orderId: string, body: UpdateOrderRequest): Promise<UpdateOrderResponse> {
  return apiPost<UpdateOrderResponse>(`api/orders/${encodeURIComponent(orderId)}/update`, body)
}

// ---------------------------------------------------------------------------
// Order Details API (fetch full order when opening Order Details from execution panel)
// ---------------------------------------------------------------------------

/** Result of fetchOrderDetails: normalized order for UI + raw API response for display. */
export interface OrderDetailsResult {
  order: Order
  rawResponse: unknown
}

/** Fetch full order details from api/orders/details/:orderId. Used when user clicks Order Details in execution panel. */
export async function fetchOrderDetails(orderId: string): Promise<OrderDetailsResult> {
  const res = await apiGet<PlaceOrderResponse>(`api/orders/details/${encodeURIComponent(orderId)}`)
  const order = mapPlaceOrderResponseToOrder(res, 'Customer', 'Waiter')
  return { order, rawResponse: res }
}

/** Extract order from place order API response. Supports top-level { order_id, order_no } and nested data.order / data. */
function getOrderFromPlaceOrderResponse(res: PlaceOrderResponse): PlaceOrderResponseOrder | null {
  if (!res || typeof res !== 'object') return null
  const r = res as Record<string, unknown>
  // Real API shape: { success, order_id, order_no, message }
  if (r.order_id != null || r.order_no != null) {
    return r as unknown as PlaceOrderResponseOrder
  }
  const data = res.data as Record<string, unknown> | undefined
  if (data && typeof data === 'object' && data.order && typeof data.order === 'object') {
    return data.order as PlaceOrderResponseOrder
  }
  if (data && typeof data === 'object' && (data.id != null || data.order_number != null || data.order_id != null || data.order_no != null)) {
    return data as unknown as PlaceOrderResponseOrder
  }
  if (res.order && typeof res.order === 'object') {
    return res.order as PlaceOrderResponseOrder
  }
  if (r.id != null || r.order_number != null) {
    return r as unknown as PlaceOrderResponseOrder
  }
  return null
}

/** Map place order API response to app Order type. Uses only API response – no client-generated order id or order number. */
export function mapPlaceOrderResponseToOrder(
  res: PlaceOrderResponse,
  fallbackCustomerName: string,
  fallbackWaiterName: string
): Order {
  const raw = getOrderFromPlaceOrderResponse(res)
  if (!raw) {
    return {
      id: '',
      orderType: 'dine-in',
      customer: fallbackCustomerName,
      items: [],
      status: 'pending',
      total: 0,
      createdAt: new Date(),
      waiter: fallbackWaiterName,
    }
  }
  // From API only: order_id (id) and order_no (order number for KOT) – no manual generation
  const id = raw.order_id != null ? String(raw.order_id) : raw.id != null ? String(raw.id) : ''
  const orderNumber = raw.order_no != null ? String(raw.order_no) : raw.order_number != null ? String(raw.order_number) : undefined
  const orderType = (raw.order_type as OrderType) || 'dine-in'
  const status = (raw.status as Order['status']) || 'pending'
  const total = Number(raw.total ?? raw.total_price ?? 0)
  const tableNumber = raw.table_number != null ? String(raw.table_number) : undefined
  const tableName = raw.table_name != null && String(raw.table_name).trim() !== ''
    ? String(raw.table_name).trim()
    : tableNumber != null
      ? `Table ${tableNumber}`
      : undefined
  const tableId = raw.table_id != null ? String(raw.table_id) : tableNumber
  // Order details API may put items in data.order_items, data.order.items, or raw.items / raw.order_items
  const data = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined
  const rawOrder = data?.order && typeof data.order === 'object' ? (data.order as Record<string, unknown>) : null
  const orderItemsFromData = data && Array.isArray(data.order_items) ? data.order_items : []
  const orderItemsFromOrder = rawOrder && Array.isArray(rawOrder.items) ? rawOrder.items : (rawOrder && Array.isArray(rawOrder.order_items) ? rawOrder.order_items : [])
  const orderItems = orderItemsFromData.length > 0
    ? orderItemsFromData
    : orderItemsFromOrder.length > 0
      ? orderItemsFromOrder
      : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.order_items)
          ? raw.order_items
          : []
  const lineId = id || 'order'
  const items: CartItem[] = orderItems.map((it: Record<string, unknown>, i: number) => {
    const productObj = it?.product && typeof it.product === 'object' ? (it.product as Record<string, unknown>) : null
    const name = String(
      it?.product_name ?? it?.name ?? it?.productName ?? it?.item_name ?? it?.title
      ?? productObj?.name ?? productObj?.product_name ?? productObj?.title ?? ''
    ).trim()
    const qty = Number(it?.quantity ?? 1) || 1
    const unitPrice = Number(it?.unit_price ?? it?.price ?? 0)
    const totalPrice = Number(it?.total_price ?? 0)
    const price = unitPrice > 0 ? unitPrice : (qty > 0 && totalPrice > 0 ? totalPrice / qty : 0)
    return {
      id: String(it?.product_id ?? it?.id ?? ''),
      lineItemId: `line-api-${lineId}-${i}`,
      name: name || 'Item',
      price,
      quantity: qty,
      selectedSize: it?.size_name != null ? String(it.size_name) : undefined,
    }
  })
  const createdAt = raw.created_at ? new Date(raw.created_at as string) : new Date()
  const customerObj = raw.customer as { name?: string } | undefined
  const waiterObj = raw.waiter as { name?: string } | undefined
  const customerName = typeof customerObj?.name === 'string' ? customerObj.name : (raw.customer_name != null ? String(raw.customer_name) : fallbackCustomerName)
  const waiterName = typeof waiterObj?.name === 'string' ? waiterObj.name : (raw.waiter_name != null ? String(raw.waiter_name) : fallbackWaiterName)
  return {
    id,
    ...(orderNumber && { orderNumber }),
    tableId,
    tableName,
    orderType,
    customer: String(customerName),
    items,
    status,
    total,
    discount: raw.discount != null ? Number(raw.discount) : undefined,
    tax: raw.tax != null ? Number(raw.tax) : undefined,
    charge: raw.charge != null ? Number(raw.charge) : undefined,
    tips: raw.tips != null ? Number(raw.tips) : undefined,
    createdAt,
    waiter: String(waiterName),
  }
}
