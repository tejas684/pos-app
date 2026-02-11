/**
 * ============================================================================
 * POS CUSTOM HOOK (hooks/usePOS.ts)
 * ============================================================================
 * 
 * This is the central state management and business logic hook for the POS system.
 * It follows React's custom hook pattern to encapsulate all POS-related logic.
 * 
 * Architecture Pattern:
 * - Custom Hook Pattern: Encapsulates state and logic in a reusable hook
 * - Separation of Concerns: Business logic separated from UI components
 * - Single Source of Truth: All POS state managed in one place
 * 
 * State Management:
 * - Uses React useState for local component state
 * - Uses useMemo for computed/derived values (totals, stats)
 * - Uses useCallback for memoized functions (performance optimization)
 * - Uses useEffect for side effects (keyboard shortcuts, time updates)
 * 
 * Key Features:
 * 1. Cart Management - Add, update, remove items
 * 2. Order Management - Create and track orders
 * 3. Discount System - Percentage or fixed amount discounts
 * 4. Tax Calculation - Configurable tax rate (default 10%)
 * 5. Keyboard Shortcuts - Power user keyboard navigation
 * 6. Real-time Stats - Active orders, revenue, order count
 * 7. Modal State - Manages all modal visibility states
 * 
 * Data Flow:
 * - Components call hook functions (addToCart, handlePlaceOrder, etc.)
 * - Hook updates state and triggers re-renders
 * - Components receive updated state via hook return values
 * 
 * Performance Optimizations:
 * - useMemo: Prevents recalculation of totals/stats on every render
 * - useCallback: Prevents function recreation on every render
 * - Memoized values only recalculate when dependencies change
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { OrderType, CartItem, Order, OrderPayment, Table } from '@/types/pos'
import { areCartItemsIdentical } from '@/types/pos'
import {
  fetchTables as fetchTablesApi,
  placeOrderApi,
  mapPlaceOrderResponseToOrder,
  cancelOrderApi,
  updateOrderApi,
  type PlaceOrderRequest,
  type PlaceOrderCartItem,
  type UpdateOrderRequest,
  type UpdateOrderCartItem,
} from '@/lib/api/pos'

const POS_ORDERS_KEY = 'pos_orders'

function loadOrdersFromStorage(): Order[] {
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

function saveOrdersToStorage(orders: Order[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(POS_ORDERS_KEY, JSON.stringify(orders))
  } catch (e) {
    console.error('Failed to persist orders:', e)
  }
}

/**
 * usePOS Hook
 * 
 * Main custom hook that provides all POS functionality.
 * 
 * @returns Object containing:
 *   - State: orderType, cartItems, selectedTable, customer, waiter, etc.
 *   - Modal States: showPaymentModal, showDiscountModal, etc.
 *   - Computed Values: quickStats, totalPayable, tax, discountAmount
 *   - Actions: addToCart, updateCartItem, handlePlaceOrder, handlePayment, etc.
 */
export function usePOS() {
  const { showToast } = useToast()
  
  // Initialize all state hooks at the top level to ensure consistent hook order
  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  // Start with no customer selected; user must pick one from API list
  const [customer, setCustomer] = useState('')
  const [waiter, setWaiter] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const ordersLoadedRef = useRef(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showRunningOrders, setShowRunningOrders] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage') // Always percentage now
  const [charge, setCharge] = useState(0)
  const [tips, setTips] = useState(0)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [showQuickStats, setShowQuickStats] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showProductOptionsModal, setShowProductOptionsModal] = useState(false)
  const [productToCustomize, setProductToCustomize] = useState<{ id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] } | null>(null)
  const [showRepeatCustomisationModal, setShowRepeatCustomisationModal] = useState(false)
  const [repeatCustomisationContext, setRepeatCustomisationContext] = useState<{
    product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }
    cartItem: CartItem
  } | null>(null)
  const [orderBeingModified, setOrderBeingModified] = useState<Order | null>(null)
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null)
  /** When paying for a specific running order (e.g. via Account), this is set so Payment modal shows its total. */
  const [orderToPay, setOrderToPay] = useState<Order | null>(null)
  /** After payment completes, set so the page can show the full invoice/bill modal for printing. */
  const [lastPaidOrderForInvoice, setLastPaidOrderForInvoice] = useState<Order | null>(null)

  // Table status management – fetched from API when app runs
  const [tables, setTables] = useState<Table[]>([])
  const [numberOfPersons, setNumberOfPersons] = useState<number>(0)

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch tables from API when app runs
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

  // Load orders from localStorage on mount; auto-complete stale pending orders so tables free up
  // (Can be overridden when POS data loads display orders from API via setOrdersFromApi.)
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted || ordersLoadedRef.current) return
    const stored = loadOrdersFromStorage()
    const STALE_HOURS = 12
    const staleCutoff = Date.now() - STALE_HOURS * 60 * 60 * 1000
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

  /** Set orders from API (e.g. display orders). Call when POS data has loaded. */
  const setOrdersFromApi = useCallback((apiOrders: Order[]) => {
    setOrders(apiOrders)
  }, [])

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || !ordersLoadedRef.current) return
    saveOrdersToStorage(orders)
  }, [orders])
  
  // Update table statuses based on orders
  // Only ACTIVE orders (pending/preparing/ready/served) make a table occupied (red).
  // Completed or cancelled → table available (green) for next customer.
  useEffect(() => {
    setTables(prevTables => {
      return prevTables.map(table => {
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
        const activeOrder = orders.find(o => isActive(o) && matchesTable(o))
        if (activeOrder) {
          return { ...table, status: 'occupied' as const, currentOrderId: activeOrder.id }
        }
        return { ...table, status: 'available' as const, currentOrderId: undefined }
      })
    })
  }, [orders])

  // Keyboard shortcuts handler
  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined' || !isMounted) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowShortcuts(prev => !prev)
      } else if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else if (cartItems.length > 0) {
          setCartItems([])
          setSelectedTable('')
          setDiscount(0)
        }
      } else if (e.key === 's' || e.key === 'S') {
        setShowQuickStats(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showShortcuts, showQuickStats, cartItems.length, isMounted])
  
  // Initialize and update time every second (only on client)
  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined' || !isMounted) return
    
    // Set initial time on client mount
    setCurrentTime(new Date())
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [isMounted])

  // Get tax rate from environment variable or default to 10%
  const taxRate = useMemo(() => {
    if (typeof window !== 'undefined') {
      const envRate = process.env.NEXT_PUBLIC_TAX_RATE
      return envRate ? parseFloat(envRate) : 10
    }
    return 10
  }, [])

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length
    const todayRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate.toDateString() === new Date().toDateString()
      })
      .reduce((sum, o) => sum + o.total, 0)
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      return orderDate.toDateString() === new Date().toDateString()
    }).length

    return {
      activeOrders,
      todayRevenue,
      todayOrders,
      cartItems: cartItems.length,
    }
  }, [orders, cartItems])

  // Check if product requires customization (has sizes or modifiers)
  // Now all products open the modal - modifiers will be shown/hidden based on product data
  const requiresCustomization = useCallback((product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => {
    // Always return true so all products open the ProductOptionsModal
    // The modal will automatically hide modifiers section for products without modifiers
    return true
  }, [])

  // Get last cart item for a product (for "repeat customisation" flow)
  const getLastCartItemForProduct = useCallback((productId: string): CartItem | undefined => {
    const matches = cartItems.filter(item => item.id === productId)
    return matches.length > 0 ? matches[matches.length - 1] : undefined
  }, [cartItems])

  // Cart summary per product (total quantity + last item) for catalog display
  const getCartSummaryByProductId = useCallback((productId: string) => {
    const items = cartItems.filter(item => item.id === productId)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const lastItem = items.length > 0 ? items[items.length - 1] : undefined
    return { totalQuantity, lastItem }
  }, [cartItems])

  const genLineItemId = () => `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  /** Payload from ProductOptionsModal (add or update). */
  type AddToCartPayload = {
    id: string
    name: string
    price: number
    category?: string
    image?: string
    modifiers?: { name: string; price: number }[]
    notes?: string
    discount?: number
    discountType?: 'percentage' | 'fixed'
    selectedSize?: string
    quantity?: number
  }

  const addToCart = useCallback((product: AddToCartPayload) => {
    const quantityToAdd = Math.max(1, Math.floor(product.quantity ?? 1))
    setAddingToCart(product.id)
    setCartItems(prev => {
      const newItemSnapshot: CartItem = {
        id: product.id,
        lineItemId: '',
        name: product.name,
        price: product.price,
        quantity: quantityToAdd,
        category: product.category,
        image: product.image,
        modifiers: product.modifiers ?? [],
        notes: product.notes ?? undefined,
        discount: product.discount,
        discountType: product.discountType,
        selectedSize: product.selectedSize,
      }
      const existingIndex = prev.findIndex(item => areCartItemsIdentical(item, newItemSnapshot))
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        }
        return updated
      }
      return [...prev, { ...newItemSnapshot, lineItemId: genLineItemId(), quantity: quantityToAdd }]
    })
    setAddingToCart(null)
    showToast(`${product.name} added to cart!`, 'success')
  }, [showToast])

  // Handle product selection: if already in cart → show "Repeat customisation?"; else → open options modal
  const handleProductSelect = useCallback((product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => {
    const lastItem = getLastCartItemForProduct(product.id)
    if (lastItem) {
      setRepeatCustomisationContext({ product, cartItem: lastItem })
      setShowRepeatCustomisationModal(true)
      return
    }
    if (requiresCustomization(product)) {
      setProductToCustomize(product)
      setShowProductOptionsModal(true)
    } else {
      addToCart(product)
    }
  }, [requiresCustomization, getLastCartItemForProduct, addToCart])

  const updateCartItem = useCallback((lineItemId: string, quantity: number) => {
    // Validate quantity: must be a positive number
    if (isNaN(quantity) || quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.lineItemId !== lineItemId))
      return
    }
    // Ensure quantity is an integer and positive
    const validQuantity = Math.max(1, Math.floor(quantity))
    setCartItems(prev =>
      prev.map(item => (item.lineItemId === lineItemId ? { ...item, quantity: validQuantity } : item))
    )
  }, [])

  const updateCartItemFull = useCallback((
    lineItemId: string,
    updates: { quantity: number; discount?: number; discountType?: 'percentage' | 'fixed'; notes?: string }
  ) => {
    const { quantity, discount, notes } = updates

    // Validate quantity: must be a positive number
    if (isNaN(quantity) || quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.lineItemId !== lineItemId))
      return
    }

    // Ensure quantity is an integer and positive
    const validQuantity = Math.max(1, Math.floor(quantity))

    // Validate discount if provided - always treat as percentage
    let validDiscount = discount
    if (discount !== undefined) {
      if (isNaN(discount) || discount < 0) {
        validDiscount = 0
      } else {
        validDiscount = Math.min(100, discount) // Clamp to 100% max
      }
    }

    setCartItems(prev =>
      prev.map(item => {
        if (item.lineItemId !== lineItemId) return item

        return {
          ...item,
          quantity: validQuantity,
          ...(validDiscount !== undefined && { discount: validDiscount }),
          discountType: 'percentage', // Always percentage
          ...(notes !== undefined && { notes }),
        }
      })
    )
  }, [])

  /**
   * Update a cart item's customization snapshot (size, modifiers, notes, price, quantity, discount).
   * Used when editing an existing cart line from the ProductOptionsModal — saves only to that item.
   */
  const updateCartItemCustomization = useCallback((
    lineItemId: string,
    payload: AddToCartPayload
  ) => {
    const quantity = Math.max(1, Math.floor(payload.quantity ?? 1))
    const discount = payload.discount != null
      ? Math.max(0, Math.min(100, payload.discount))
      : undefined

    setCartItems(prev =>
      prev.map(item => {
        if (item.lineItemId !== lineItemId) return item
        return {
          ...item,
          price: payload.price,
          selectedSize: payload.selectedSize ?? undefined,
          modifiers: payload.modifiers ?? [],
          notes: (payload.notes ?? '').trim() || undefined,
          quantity,
          discount,
          discountType: (payload.discountType ?? 'percentage') as 'percentage' | 'fixed',
        }
      })
    )
  }, [])

  const removeFromCart = useCallback((lineItemId: string) => {
    setCartItems(prev => prev.filter(item => item.lineItemId !== lineItemId))
  }, [])

  // Decrement quantity for a product in cart (targets last line with that product id)
  const decrementProductInCart = useCallback((productId: string) => {
    setCartItems(prev => {
      const idx = prev.map(item => item.id).lastIndexOf(productId)
      if (idx < 0) return prev
      const item = prev[idx]
      if (item.quantity <= 1) {
        return prev.filter(i => i.lineItemId !== item.lineItemId)
      }
      const updated = [...prev]
      updated[idx] = { ...item, quantity: item.quantity - 1 }
      return updated
    })
  }, [])

  // Add one more with same customization (from "Repeat" in RepeatCustomisationModal)
  const repeatCustomisationAddOne = useCallback(() => {
    if (!repeatCustomisationContext) return
    const { cartItem } = repeatCustomisationContext
    addToCart({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      category: cartItem.category,
      image: cartItem.image,
      modifiers: cartItem.modifiers ?? [],
      notes: cartItem.notes,
      discount: cartItem.discount,
      discountType: cartItem.discountType,
      selectedSize: cartItem.selectedSize,
      quantity: 1,
    })
    setShowRepeatCustomisationModal(false)
    setRepeatCustomisationContext(null)
  }, [repeatCustomisationContext, addToCart])

  // Open full ProductOptionsModal from "I'll choose" in RepeatCustomisationModal
  const openProductOptionsFromRepeat = useCallback(() => {
    if (!repeatCustomisationContext) return
    setProductToCustomize(repeatCustomisationContext.product)
    setShowRepeatCustomisationModal(false)
    setRepeatCustomisationContext(null)
    setShowProductOptionsModal(true)
  }, [repeatCustomisationContext])

  const closeRepeatCustomisationModal = useCallback(() => {
    setShowRepeatCustomisationModal(false)
    setRepeatCustomisationContext(null)
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    setSelectedTable('')
    setNumberOfPersons(0)
    setDiscount(0)
    setCharge(0)
    setTips(0)
    setOrderBeingModified(null)
  }, [])

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName)
    setOrderType('dine-in')
  }, [])

  /** Called when user confirms table selection in the Select Tables modal (multiple tables + number of persons). */
  const handleTablesConfirm = useCallback((tableNames: string[], persons: number) => {
    setSelectedTable(tableNames.length > 0 ? tableNames.join(', ') : '')
    setNumberOfPersons(Math.max(0, persons))
    setOrderType('dine-in')
  }, [])

  const round2 = (n: number) => Math.round(n * 100) / 100

  const subtotal = useMemo(() => {
    const sum = cartItems.reduce((acc, item) => {
      const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
      const lineTotal = itemPrice * item.quantity
      const itemDiscount = !item.discount || item.discount <= 0
        ? 0
        : (lineTotal * item.discount) / 100
      return acc + round2(lineTotal - itemDiscount)
    }, 0)
    return round2(sum)
  }, [cartItems])

  const discountAmount = useMemo(() => {
    const clampedDiscount = Math.max(0, Math.min(100, discount))
    return round2((subtotal * clampedDiscount) / 100)
  }, [subtotal, discount])

  const tax = useMemo(() => {
    // Calculate tax individually for each product/item based on its price, then combine/sum them
    const totalTax = cartItems.reduce((acc, item) => {
      // Calculate item price including modifiers (base price + modifier prices)
      const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
      // Calculate line total for this item (price * quantity)
      const lineTotal = itemPrice * item.quantity
      // Calculate tax for this individual product/item (tax on the product's price)
      const itemTax = lineTotal * (taxRate / 100)
      // Add this item's tax to the total
      return acc + itemTax
    }, 0)
    // Return the combined total of all individual product taxes
    return round2(totalTax)
  }, [cartItems, taxRate])

  const totalPayable = useMemo(() => {
    const safeCharge = Math.max(0, charge)
    const safeTips = Math.max(0, tips)
    const base = Math.max(0, subtotal - discountAmount)
    return round2(base + tax + safeCharge + safeTips)
  }, [subtotal, discountAmount, tax, charge, tips])

  const handlePlaceOrder = useCallback(async (options?: {
    markCompleted?: boolean
    payment?: OrderPayment
    waiterId?: number
    customerId?: number
  }): Promise<Order | undefined> => {
    if (cartItems.length === 0) {
      showToast('Cart is empty!', 'error')
      return undefined
    }

    if (orderType === 'dine-in' && !selectedTable) {
      showToast('Please select a table!', 'error')
      return undefined
    }

    if (!waiter || waiter.trim() === '') {
      showToast('Please select a waiter!', 'error')
      return undefined
    }

    // Extract table ID from selectedTable (format: "Table 01" -> "01")
    let tableId: string | undefined
    let tableName: string | undefined
    if (selectedTable && orderType === 'dine-in') {
      tableName = selectedTable
      const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
      if (tableMatch) {
        tableId = tableMatch[1].padStart(2, '0')
      } else {
        const table = tables.find(t =>
          t.name === selectedTable || t.name.toLowerCase() === selectedTable.toLowerCase()
        )
        if (table) {
          tableId = table.id
          tableName = table.name
        }
      }
      const table = tables.find(t =>
        (tableId && t.id === tableId) ||
        (tableName && (t.name === tableName || t.name.toLowerCase() === tableName.toLowerCase()))
      )
      if (table && table.status === 'occupied') {
        showToast(`Table ${table.name} is already booked. Please select an available (green) table.`, 'error')
        return undefined
      }
    }

    const markCompleted = options?.markCompleted ?? false
    const payment = options?.payment
    const waiterId = options?.waiterId
    const customerId = options?.customerId

    // Place order via API when waiter and customer IDs are provided (e.g. from Place Order button)
    if (waiterId != null && customerId != null && !payment) {
      const tableNumber =
        (selectedTable && selectedTable.match(/Table\s*(\d+)/i)?.[1]) ||
        (tableId ?? selectedTable?.replace(/\D/g, '')) ||
        '0'
      const firstTable = tables.find(
        (t) =>
          (tableId && t.id === tableId) ||
          (tableName && (t.name === tableName || t.name.toLowerCase() === tableName?.toLowerCase()))
      )
      const areas = firstTable?.area ?? 'Hall'
      const persons = Math.max(0, numberOfPersons)
      const pricePerPerson = persons > 0 ? (charge / persons).toFixed(2) : '0'

      const cartForApi: PlaceOrderCartItem[] = cartItems.map((item) => {
        const unitPrice = item.price + (item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0)
        const totalPrice = round2(unitPrice * item.quantity)
        return {
          product_id: Number(item.id) || 0,
          product_name: item.name,
          size_id: null,
          size_name: item.selectedSize ?? null,
          quantity: item.quantity,
          unit_price: round2(unitPrice),
          total_price: totalPrice,
        }
      })

      const body: PlaceOrderRequest = {
        customer_id: customerId,
        waiter_id: waiterId,
        order_type: orderType,
        areas,
        table_number: String(tableNumber),
        selected_persons: String(persons),
        price_per_person: pricePerPerson,
        total_charge: Math.max(0, charge),
        delivery_partner: null,
        total_price: totalPayable,
        cart: cartForApi,
      }

      try {
        const res = await placeOrderApi(body)
        const order = mapPlaceOrderResponseToOrder(res, customer, waiter)
        // API may not return table – use table from the request we just sent so KOT shows it
        const orderWithTable: Order = {
          ...order,
          tableId: order.tableId || tableNumber || undefined,
          tableName: order.tableName || firstTable?.name || selectedTable || (tableNumber ? `Table ${tableNumber}` : undefined),
        }
        setOrders((prev) => [...prev, orderWithTable])
        setLastPlacedOrder(orderWithTable)
        clearCart()
        setOrderBeingModified(null)
        const tablePart = orderWithTable.tableName ? ` ${orderWithTable.tableName} is now booked.` : ''
        showToast(`Order ${orderWithTable.id} placed successfully!${tablePart}`, 'success')
        return orderWithTable
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to place order'
        showToast(message, 'error')
        return undefined
      }
    }

    // Local-only path (e.g. payment with cart or when API IDs not provided)
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      tableId: tableId || undefined,
      tableName: tableName || undefined,
      orderType,
      customer,
      items: [...cartItems],
      status: markCompleted ? 'completed' : 'pending',
      total: totalPayable,
      discount: discountAmount,
      tax,
      charge,
      tips,
      createdAt: new Date(),
      waiter,
      ...(payment && { payment }),
    }

    setOrders((prev) => [...prev, newOrder])
    if (payment) {
      setLastPaidOrderForInvoice(newOrder)
      setLastPlacedOrder(null)
    } else {
      setLastPlacedOrder(newOrder)
    }
    clearCart()
    setSelectedTable('')
    setOrderBeingModified(null)
    const tablePart = tableName ? ` Table ${tableName} is now ${markCompleted ? 'available' : 'booked'}.` : ''
    showToast(
      markCompleted
        ? `Order ${newOrder.id} placed and paid!${tablePart}`
        : `Order ${newOrder.id} placed successfully!${tablePart}`,
      'success'
    )
    return newOrder
  }, [
    cartItems,
    orderType,
    selectedTable,
    customer,
    totalPayable,
    discountAmount,
    tax,
    charge,
    numberOfPersons,
    waiter,
    clearCart,
    showToast,
    tables,
  ])

  type PaymentPayload = { method: 'cash' | 'card'; amount: number; change?: number; cardDetails?: import('@/types/pos').OrderPaymentCardDetails }
  const handlePayment = useCallback((paymentData: PaymentPayload) => {
    if (isNaN(paymentData.amount) || paymentData.amount < 0) {
      showToast('Invalid payment amount', 'error')
      return
    }

    const payment: OrderPayment = {
      method: paymentData.method,
      amount: paymentData.amount,
      ...(paymentData.change != null && { change: paymentData.change }),
      ...(paymentData.cardDetails && { cardDetails: paymentData.cardDetails }),
    }

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')

    // When payment modal was opened via Invoice/Account, always pay that order (do not use cart or table check)
    if (orderToPay) {
      if (paymentData.amount < orderToPay.total && paymentData.method === 'cash') {
        showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than order total (₹${orderToPay.total.toFixed(2)})`, 'error')
        return
      }
      const paidOrder = { ...orderToPay, status: 'completed' as const, payment }
      setOrders(prev => prev.map(o =>
        o.id === orderToPay.id ? paidOrder : o
      ))
      setOrderToPay(null)
      setShowPaymentModal(false)
      setLastPaidOrderForInvoice(paidOrder)
      const msg = orderToPay.tableName
        ? `Payment received for ${orderToPay.id}! ${orderToPay.tableName} is now available.`
        : `Payment received for ${orderToPay.id}!`
      showToast(msg, 'success')
      return
    }

    // When modifying an order and paying from cart: update existing order and mark paid (skip "table occupied" check)
    if (orderBeingModified && cartItems.length > 0) {
      if (paymentData.amount < totalPayable && paymentData.method === 'cash') {
        showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than total (₹${totalPayable.toFixed(2)})`, 'error')
        return
      }
      let tableId: string | undefined
      let tableName: string | undefined
      if (selectedTable && orderType === 'dine-in') {
        tableName = selectedTable
        const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
        if (tableMatch) {
          tableId = tableMatch[1].padStart(2, '0')
        } else {
          const table = tables.find(t =>
            t.name === selectedTable || t.name.toLowerCase() === selectedTable.toLowerCase()
          )
          if (table) {
            tableId = table.id
            tableName = table.name
          }
        }
      }
      const paidOrder: Order = {
        ...orderBeingModified,
        tableId: tableId ?? orderBeingModified.tableId,
        tableName: tableName ?? orderBeingModified.tableName,
        orderType,
        customer,
        items: [...cartItems],
        total: totalPayable,
        discount: discountAmount,
        tax,
        charge,
        tips,
        waiter,
        status: 'completed',
        payment,
      }
      setOrders(prev => prev.map(o =>
        o.id === orderBeingModified.id ? paidOrder : o
      ))
      setLastPaidOrderForInvoice(paidOrder)
      clearCart()
      setSelectedTable('')
      setOrderBeingModified(null)
      setShowPaymentModal(false)
      const msg = paidOrder.tableName
        ? `Order ${orderBeingModified.id} updated and paid! ${paidOrder.tableName} is now available.`
        : `Order ${orderBeingModified.id} updated and paid!`
      showToast(msg, 'success')
      return
    }

    if (cartItems.length > 0) {
      if (paymentData.amount < totalPayable && paymentData.method === 'cash') {
        showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than total (₹${totalPayable.toFixed(2)})`, 'error')
        return
      }
      setOrderToPay(null)
      void handlePlaceOrder({ markCompleted: true, payment }).then((newOrder) => {
        if (newOrder) setShowPaymentModal(false)
      })
      return
    }

    const order = activeOrders[0]
    if (order) {
      if (paymentData.amount < order.total && paymentData.method === 'cash') {
        showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than order total (₹${order.total.toFixed(2)})`, 'error')
        return
      }
      const paidOrder = { ...order, status: 'completed' as const, payment }
      setOrders(prev => prev.map(o =>
        o.id === order.id ? paidOrder : o
      ))
      setShowPaymentModal(false)
      setLastPaidOrderForInvoice(paidOrder)
      const msg = order.tableName
        ? `Payment received for ${order.id}! ${order.tableName} is now available.`
        : `Payment received for ${order.id}!`
      showToast(msg, 'success')
    } else {
      showToast('No active order to pay', 'error')
      setShowPaymentModal(false)
    }
  }, [cartItems, orders, orderToPay, orderBeingModified, totalPayable, discountAmount, tax, charge, tips, orderType, selectedTable, customer, waiter, tables, clearCart, handlePlaceOrder, showToast])

  const handleUpdateOrder = useCallback(async (options?: { customerId: number; waiterId: number }) => {
    if (!orderBeingModified) {
      showToast('No order selected for modification!', 'error')
      return
    }

    if (cartItems.length === 0) {
      showToast('Cart is empty!', 'error')
      return
    }

    if (orderType === 'dine-in' && !selectedTable) {
      showToast('Please select a table!', 'error')
      return
    }

    if (!waiter || waiter.trim() === '') {
      showToast('Please select a waiter!', 'error')
      return
    }

    // When API update is requested, require customer and waiter IDs
    if (options != null && (options.customerId == null || options.waiterId == null)) {
      showToast('Please select a customer and waiter from the list.', 'error')
      return
    }

    // Extract table ID from selectedTable (format: "Table 01" -> "01")
    let tableId: string | undefined
    let tableName: string | undefined
    if (selectedTable && orderType === 'dine-in') {
      tableName = selectedTable
      const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
      if (tableMatch) {
        tableId = tableMatch[1].padStart(2, '0')
      } else {
        const table = tables.find(t =>
          t.name === selectedTable ||
          t.name.toLowerCase() === selectedTable.toLowerCase()
        )
        if (table) {
          tableId = table.id
          tableName = table.name
        }
      }
    }

    const orderIdNum = Number(orderBeingModified.id)

    // If customerId/waiterId provided, call update order API then sync local state and show KOT
    if (options != null) {
      const tableNumber =
        (selectedTable && selectedTable.match(/Table\s*(\d+)/i)?.[1]) ||
        (tableId ?? selectedTable?.replace(/\D/g, '')) ||
        '0'
      const firstTable = tables.find(
        (t) =>
          (tableId && t.id === tableId) ||
          (tableName && (t.name === tableName || t.name.toLowerCase() === tableName?.toLowerCase()))
      )
      const areas = firstTable?.area ?? 'Hall'
      const persons = Math.max(0, numberOfPersons)
      const pricePerPerson = persons > 0 ? (charge / persons).toFixed(2) : '0'

      const cartForApi: UpdateOrderCartItem[] = cartItems.map((item) => {
        const unitPrice = item.price + (item.modifiers?.reduce((s, m) => s + m.price, 0) ?? 0)
        const totalPrice = round2(unitPrice * item.quantity)
        return {
          order_id: orderIdNum,
          product_id: Number(item.id) || 0,
          product_name: item.name,
          size_id: null,
          size_name: item.selectedSize ?? null,
          quantity: item.quantity,
          total_price: totalPrice,
        }
      })

      const body: UpdateOrderRequest = {
        customer_id: options.customerId,
        waiter_id: options.waiterId,
        order_type: orderType,
        areas,
        table_number: String(tableNumber),
        selected_persons: String(persons),
        price_per_person: pricePerPerson,
        total_charge: String(Math.max(0, charge)),
        total_price: String(totalPayable),
        cart: cartForApi,
      }

      try {
        await updateOrderApi(orderBeingModified.id, body)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update order'
        showToast(message, 'error')
        return
      }
    }

    // Build the updated order so we can show KOT reprint with updates
    const updatedOrder: Order = {
      ...orderBeingModified,
      tableId: tableId ?? orderBeingModified.tableId,
      tableName: tableName ?? orderBeingModified.tableName,
      orderType,
      customer,
      items: [...cartItems],
      total: totalPayable,
      discount: discountAmount,
      tax,
      charge,
      tips,
      waiter,
    }

    setOrders(prev => prev.map(order =>
      order.id === orderBeingModified.id ? updatedOrder : order
    ))

    setLastPlacedOrder(updatedOrder) // Show KOT modal so user can reprint with updates
    clearCart()
    setSelectedTable('')
    setOrderBeingModified(null)
    showToast(`Order ${orderBeingModified.id} updated successfully! You can reprint the KOT.`, 'success')
  }, [orderBeingModified, cartItems, orderType, selectedTable, customer, totalPayable, discountAmount, tax, charge, waiter, numberOfPersons, clearCart, showToast, tables])

  const loadOrderForModification = useCallback((order: Order) => {
    setOrderBeingModified(order)
    setCartItems(
      order.items.map((it, i) => ({
        ...it,
        lineItemId: (it as CartItem & { lineItemId?: string }).lineItemId ?? genLineItemId(),
      }))
    )
    setSelectedTable(order.tableName || '')
    setOrderType(order.orderType)
    setCustomer(order.customer)
    setWaiter(order.waiter || '')
    // Calculate discount from order
    if (order.discount && order.discount > 0) {
      // Estimate discount percentage (this is approximate)
      const tax = order.tax || 0
      const estimatedDiscount = (order.discount / (order.total - tax + order.discount)) * 100
      setDiscount(Math.min(100, Math.max(0, estimatedDiscount)))
    } else {
      setDiscount(0)
    }
    // Restore charge and tips
    setCharge(order.charge || 0)
    setTips(order.tips || 0)
    showToast(`Order ${order.id} loaded for modification`, 'info')
  }, [showToast])

  const handleApplyDiscount = useCallback((discountValue: number, type: 'percentage' | 'fixed') => {
    // Validate discount value - always use percentage
    if (isNaN(discountValue) || discountValue < 0) {
      showToast('Invalid discount value', 'error')
      return
    }
    
    // Always validate as percentage
    if (discountValue > 100) {
      showToast('Percentage discount cannot exceed 100%', 'error')
      return
    }
    
    setDiscount(discountValue)
    setDiscountType('percentage') // Always set to percentage
    setShowDiscountModal(false)
  }, [showToast])

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    )
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
    showToast(`Order ${orderId} → ${statusLabel}`, 'success')
  }, [showToast])

  const handleCancelOrder = useCallback(async (orderId: string) => {
    const reason = 'Customer changed mind'
    try {
      await cancelOrderApi(orderId, reason)
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: 'cancelled' as const } : order
      ))
      if (orderBeingModified?.id === orderId) {
        clearCart()
      }
      showToast(`Order ${orderId} cancelled`, 'success')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to cancel order'
      showToast(message, 'error')
    }
  }, [showToast, orderBeingModified?.id, clearCart])

  return {
    // State
    orderType,
    setOrderType,
    cartItems,
    selectedTable,
    setSelectedTable,
    customer,
    setCustomer,
    waiter,
    setWaiter,
    orders,
    discount,
    discountType,
    charge,
    setCharge,
    tips,
    setTips,
    currentTime,
    addingToCart,
    tables,
    numberOfPersons,
    setNumberOfPersons,
    handleTablesConfirm,

    // Modal states
    showPaymentModal,
    setShowPaymentModal,
    showDiscountModal,
    setShowDiscountModal,
    showCustomerModal,
    setShowCustomerModal,
    showTableModal,
    setShowTableModal,
    showQuickStats,
    setShowQuickStats,
    showQuickActions,
    setShowQuickActions,
    showShortcuts,
    setShowShortcuts,
    showProductOptionsModal,
    setShowProductOptionsModal,
    productToCustomize,
    setProductToCustomize,
    showRepeatCustomisationModal,
    setShowRepeatCustomisationModal,
    repeatCustomisationContext,
    getCartSummaryByProductId,
    decrementProductInCart,
    repeatCustomisationAddOne,
    openProductOptionsFromRepeat,
    closeRepeatCustomisationModal,

    // Computed values
    taxRate,
    quickStats,
    subtotal,
    discountAmount,
    tax,
    totalPayable,
    
    // Actions
    addToCart,
    handleProductSelect,
    updateCartItem,
    updateCartItemFull,
    updateCartItemCustomization,
    removeFromCart,
    clearCart,
    handleTableSelect,
    handlePlaceOrder,
    handleUpdateOrder,
    handlePayment,
    handleApplyDiscount,
    handleCancelOrder,
    updateOrderStatus,
    loadOrderForModification,
    orderBeingModified,
    lastPlacedOrder,
    setLastPlacedOrder,
    orderToPay,
    setOrderToPay,
    lastPaidOrderForInvoice,
    setLastPaidOrderForInvoice,
    setOrdersFromApi,
  }
}
