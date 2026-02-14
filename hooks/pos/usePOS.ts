/**
 * Main POS hook – composes cart, orders, modals, and order/payment flows.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { OrderType, Order, OrderPayment } from '@/types/pos'
import type { CartItem } from '@/types/pos'
import {
  placeOrderApi,
  mapPlaceOrderResponseToOrder,
  cancelOrderApi,
  updateOrderApi,
  type PlaceOrderRequest,
  type PlaceOrderCartItem,
  type UpdateOrderRequest,
  type UpdateOrderCartItem,
} from '@/lib/api/pos'
import { usePOSCart, type AddToCartPayload, type ProductForCustomization } from './usePOSCart'
import { usePOSOrders } from './usePOSOrders'
import { TAX_RATE } from './constants'
import { round2, computeSubtotal, computeDiscountAmount, computeTotalPayable } from './calculations'

export function usePOS() {
  const { showToast } = useToast()
  const ordersApi = usePOSOrders()
  const { orders, setOrders, tables, setOrdersFromApi, isMounted } = ordersApi
  const cart = usePOSCart(showToast)
  const {
    cartItems,
    setCartItems,
    addingToCart,
    addToCart,
    updateCartItem,
    updateCartItemFull,
    updateCartItemCustomization,
    removeFromCart,
    decrementProductInCart,
    getLastCartItemForProduct,
    getCartSummaryByProductId,
    requiresCustomization,
    clearCartItems,
    genLineItemId,
  } = cart

  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [customer, setCustomer] = useState('')
  const [waiter, setWaiter] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showRunningOrders, setShowRunningOrders] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [charge, setCharge] = useState(0)
  const [tips, setTips] = useState(0)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [showQuickStats, setShowQuickStats] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showProductOptionsModal, setShowProductOptionsModal] = useState(false)
  const [productToCustomize, setProductToCustomize] = useState<ProductForCustomization | null>(null)
  const [showRepeatCustomisationModal, setShowRepeatCustomisationModal] = useState(false)
  const [repeatCustomisationContext, setRepeatCustomisationContext] = useState<{
    product: ProductForCustomization
    cartItem: CartItem
  } | null>(null)
  const [orderBeingModified, setOrderBeingModified] = useState<Order | null>(null)
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null)
  const [orderToPay, setOrderToPay] = useState<Order | null>(null)
  const [lastPaidOrderForInvoice, setLastPaidOrderForInvoice] = useState<Order | null>(null)
  const [numberOfPersons, setNumberOfPersons] = useState<number>(0)

  const clearCart = useCallback(() => {
    clearCartItems()
    setSelectedTable('')
    setNumberOfPersons(0)
    setDiscount(0)
    setCharge(0)
    setTips(0)
    setOrderBeingModified(null)
  }, [clearCartItems])

  const handleProductSelect = useCallback(
    (product: ProductForCustomization) => {
      const lastItem = getLastCartItemForProduct(product.id)
      if (lastItem) {
        addToCart({
          id: lastItem.id,
          name: lastItem.name,
          price: lastItem.price,
          quantity: 1,
          category: lastItem.category,
          image: lastItem.image,
          modifiers: lastItem.modifiers ?? [],
          notes: lastItem.notes,
          selectedSize: lastItem.selectedSize,
        })
        return
      }
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        image: product.image,
        modifiers: [],
      })
    },
    [getLastCartItemForProduct, addToCart]
  )

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

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName)
    setOrderType('dine-in')
  }, [])

  const handleTablesConfirm = useCallback((tableNames: string[], persons: number) => {
    setSelectedTable(tableNames.length > 0 ? tableNames.join(', ') : '')
    setNumberOfPersons(Math.max(0, persons))
    setOrderType('dine-in')
  }, [])

  const subtotal = useMemo(() => computeSubtotal(cartItems), [cartItems])
  const discountAmount = useMemo(() => computeDiscountAmount(subtotal, discount), [subtotal, discount])
  const tax = 0
  const totalPayable = useMemo(
    () => computeTotalPayable(subtotal, discountAmount, charge, tips),
    [subtotal, discountAmount, charge, tips]
  )

  const quickStats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length
    const todayRevenue = orders
      .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.total, 0)
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length
    return { activeOrders, todayRevenue, todayOrders, cartItems: cartItems.length }
  }, [orders, cartItems])

  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'Escape') {
        if (cartItems.length > 0) {
          setCartItems([])
          setSelectedTable('')
          setDiscount(0)
        }
      } else if (e.key === 's' || e.key === 'S') {
        setShowQuickStats((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showQuickStats, cartItems.length, isMounted, setCartItems])

  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isMounted])

  const handlePlaceOrder = useCallback(
    async (options?: {
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

      let tableId: string | undefined
      let tableName: string | undefined
      if (selectedTable && orderType === 'dine-in') {
        tableName = selectedTable
        const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
        if (tableMatch) {
          tableId = tableMatch[1].padStart(2, '0')
        } else {
          const table = tables.find(
            (t) => t.name === selectedTable || t.name.toLowerCase() === selectedTable.toLowerCase()
          )
          if (table) {
            tableId = table.id
            tableName = table.name
          }
        }
        const table = tables.find(
          (t) =>
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
          return {
            product_id: Number(item.id) || 0,
            product_name: item.name,
            size_id: null,
            size_name: item.selectedSize ?? null,
            quantity: item.quantity,
            unit_price: round2(unitPrice),
            total_price: round2(unitPrice * item.quantity),
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
          const orderWithTable: Order = {
            ...order,
            tableId: order.tableId || tableNumber || undefined,
            tableName: order.tableName || firstTable?.name || selectedTable || (tableNumber ? `Table ${tableNumber}` : undefined),
          }
          setOrders((prev) => [...prev, orderWithTable])
          setLastPlacedOrder(orderWithTable)
          clearCart()
          setOrderBeingModified(null)
          showToast(`Order ${orderWithTable.id} placed successfully!${orderWithTable.tableName ? ` ${orderWithTable.tableName} is now booked.` : ''}`, 'success')
          return orderWithTable
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Failed to place order', 'error')
          return undefined
        }
      }

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
        markCompleted ? `Order ${newOrder.id} placed and paid!${tablePart}` : `Order ${newOrder.id} placed successfully!${tablePart}`,
        'success'
      )
      return newOrder
    },
    [
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
      setOrders,
    ]
  )

  type PaymentPayload = {
    method: 'cash' | 'card'
    amount: number
    change?: number
    cardDetails?: import('@/types/pos').OrderPaymentCardDetails
  }
  const handlePayment = useCallback(
    (paymentData: PaymentPayload) => {
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
      const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled')

      if (orderToPay) {
        if (paymentData.amount < orderToPay.total && paymentData.method === 'cash') {
          showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than order total (₹${orderToPay.total.toFixed(2)})`, 'error')
          return
        }
        const paidOrder = { ...orderToPay, status: 'completed' as const, payment }
        setOrders((prev) => prev.map((o) => (o.id === orderToPay.id ? paidOrder : o)))
        setOrderToPay(null)
        setShowPaymentModal(false)
        setLastPaidOrderForInvoice(paidOrder)
        showToast(orderToPay.tableName ? `Payment received for ${orderToPay.id}! ${orderToPay.tableName} is now available.` : `Payment received for ${orderToPay.id}!`, 'success')
        return
      }

      if (orderBeingModified && cartItems.length > 0) {
        if (paymentData.amount < totalPayable && paymentData.method === 'cash') {
          showToast(`Payment amount (₹${paymentData.amount.toFixed(2)}) is less than total (₹${totalPayable.toFixed(2)})`, 'error')
          return
        }
        let tid: string | undefined
        let tname: string | undefined
        if (selectedTable && orderType === 'dine-in') {
          tname = selectedTable
          const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
          if (tableMatch) tid = tableMatch[1].padStart(2, '0')
          else {
            const t = tables.find((t) => t.name === selectedTable || t.name.toLowerCase() === selectedTable.toLowerCase())
            if (t) {
              tid = t.id
              tname = t.name
            }
          }
        }
        const paidOrder: Order = {
          ...orderBeingModified,
          tableId: tid ?? orderBeingModified.tableId,
          tableName: tname ?? orderBeingModified.tableName,
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
        setOrders((prev) => prev.map((o) => (o.id === orderBeingModified.id ? paidOrder : o)))
        setLastPaidOrderForInvoice(paidOrder)
        clearCart()
        setSelectedTable('')
        setOrderBeingModified(null)
        setShowPaymentModal(false)
        showToast(paidOrder.tableName ? `Order ${orderBeingModified.id} updated and paid! ${paidOrder.tableName} is now available.` : `Order ${orderBeingModified.id} updated and paid!`, 'success')
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
        setOrders((prev) => prev.map((o) => (o.id === order.id ? paidOrder : o)))
        setShowPaymentModal(false)
        setLastPaidOrderForInvoice(paidOrder)
        showToast(order.tableName ? `Payment received for ${order.id}! ${order.tableName} is now available.` : `Payment received for ${order.id}!`, 'success')
      } else {
        showToast('No active order to pay', 'error')
        setShowPaymentModal(false)
      }
    },
    [
      cartItems,
      orders,
      orderToPay,
      orderBeingModified,
      totalPayable,
      discountAmount,
      tax,
      charge,
      tips,
      orderType,
      selectedTable,
      customer,
      waiter,
      tables,
      clearCart,
      handlePlaceOrder,
      showToast,
      setOrders,
    ]
  )

  const handleUpdateOrder = useCallback(
    async (options?: { customerId: number; waiterId: number }) => {
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
      if (options != null && (options.customerId == null || options.waiterId == null)) {
        showToast('Please select a customer and waiter from the list.', 'error')
        return
      }

      let tableId: string | undefined
      let tableName: string | undefined
      if (selectedTable && orderType === 'dine-in') {
        tableName = selectedTable
        const tableMatch = selectedTable.match(/Table\s+(\d+)/i)
        if (tableMatch) tableId = tableMatch[1].padStart(2, '0')
        else {
          const table = tables.find(
            (t) => t.name === selectedTable || t.name.toLowerCase() === selectedTable.toLowerCase()
          )
          if (table) {
            tableId = table.id
            tableName = table.name
          }
        }
      }
      const orderIdNum = Number(orderBeingModified.id)

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
          return {
            order_id: orderIdNum,
            product_id: Number(item.id) || 0,
            product_name: item.name,
            size_id: null,
            size_name: item.selectedSize ?? null,
            quantity: item.quantity,
            total_price: round2(unitPrice * item.quantity),
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
          showToast(e instanceof Error ? e.message : 'Failed to update order', 'error')
          return
        }
      }

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
      setOrders((prev) => prev.map((order) => (order.id === orderBeingModified.id ? updatedOrder : order)))
      setLastPlacedOrder(updatedOrder)
      clearCart()
      setSelectedTable('')
      setOrderBeingModified(null)
      showToast(`Order ${orderBeingModified.id} updated successfully! You can reprint the KOT.`, 'success')
    },
    [
      orderBeingModified,
      cartItems,
      orderType,
      selectedTable,
      customer,
      totalPayable,
      discountAmount,
      tax,
      charge,
      waiter,
      numberOfPersons,
      clearCart,
      showToast,
      tables,
      setOrders,
    ]
  )

  const loadOrderForModification = useCallback(
    (order: Order) => {
      setOrderBeingModified(order)
      setCartItems(
        order.items.map((it) => ({
          ...it,
          lineItemId: (it as CartItem & { lineItemId?: string }).lineItemId ?? genLineItemId(),
        }))
      )
      setSelectedTable(order.tableName || '')
      setOrderType(order.orderType)
      setCustomer(order.customer)
      setWaiter(order.waiter || '')
      if (order.discount && order.discount > 0) {
        const estimatedDiscount =
          order.total > 0 && order.discount ? (order.discount / (order.total + order.discount)) * 100 : 0
        setDiscount(Math.min(100, Math.max(0, estimatedDiscount)))
      } else {
        setDiscount(0)
      }
      setCharge(order.charge || 0)
      setTips(order.tips || 0)
      showToast(`Order ${order.id} loaded for modification`, 'info')
    },
    [showToast, setCartItems, genLineItemId]
  )

  const handleApplyDiscount = useCallback(
    (discountValue: number, _type: 'percentage' | 'fixed') => {
      if (isNaN(discountValue) || discountValue < 0) {
        showToast('Invalid discount value', 'error')
        return
      }
      if (discountValue > 100) {
        showToast('Percentage discount cannot exceed 100%', 'error')
        return
      }
      setDiscount(discountValue)
      setDiscountType('percentage')
      setShowDiscountModal(false)
    },
    [showToast]
  )

  const updateOrderStatus = useCallback(
    (orderId: string, status: Order['status']) => {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
      showToast(`Order ${orderId} → ${statusLabel}`, 'success')
    },
    [showToast, setOrders]
  )

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      const reason = 'Customer changed mind'
      try {
        await cancelOrderApi(orderId, reason)
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: 'cancelled' as const } : order)))
        if (orderBeingModified?.id === orderId) clearCart()
        showToast(`Order ${orderId} cancelled`, 'success')
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to cancel order'
        showToast(message, 'error')
      }
    },
    [showToast, orderBeingModified?.id, clearCart, setOrders]
  )

  return {
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
    taxRate: TAX_RATE,
    quickStats,
    subtotal,
    discountAmount,
    tax,
    totalPayable,
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
