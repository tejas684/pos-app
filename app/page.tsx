/**
 * ============================================================================
 * POS MAIN PAGE (app/page.tsx)
 * ============================================================================
 * 
 * This is the main Point of Sale (POS) system page - the core of the application.
 * 
 * Architecture:
 * - Uses 'use client' directive because it needs React hooks and interactivity
 * - Orchestrates all POS components and manages their interactions
 * - Uses the usePOS custom hook for all business logic and state management
 * 
 * Component Structure:
 * 1. POSHeader - Top navigation bar with stats and action buttons
 * 2. OrderManagementPanel (Left 40%) - Cart, order details, customer info
 * 3. ProductCatalogPanel (Right 60%) - Product browsing and selection
 * 4. QuickActionsMenu - Floating action button with quick actions
 * 5. Modals - Payment, Discount, Table Selection, Keyboard Shortcuts
 * 
 * State Management:
 * - All state is managed in the usePOS hook (hooks/usePOS.ts)
 * - This page acts as a container that passes props to child components
 * - Follows the "container/presentational" pattern
 * 
 * Key Features:
 * - Real-time order management
 * - Multiple order types (dine-in, take-away, delivery)
 * - Table selection for dine-in orders
 * - Discount application (percentage-based)
 * - Payment processing
 * - Keyboard shortcuts for power users
 */

'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { usePOS } from '@/hooks/usePOS'
import { usePOSData } from '@/contexts/POSDataContext'
import POSHeader from '@/components/POS/POSHeader'
import ExecutionOrdersSidebar from '@/components/POS/ExecutionOrdersSidebar'
import OrderManagementPanel from '@/components/POS/OrderManagementPanel'
import ProductCatalogPanel from '@/components/POS/ProductCatalogPanel'
import PaymentModal, { type BillSummaryValues } from '@/components/POS/PaymentModal'
import InvoiceBillModal from '@/components/POS/InvoiceBillModal'
import DiscountModal from '@/components/POS/DiscountModal'
import AddCustomerModal from '@/components/POS/AddCustomerModal'
import type { AddCustomerFormData, CustomerToEdit } from '@/components/POS/AddCustomerModal'
import KeyboardShortcuts from '@/components/POS/KeyboardShortcuts'
import TablesModal from '@/components/POS/TablesModal'
import ProductOptionsModal from '@/components/POS/ProductOptionsModal'
import RepeatCustomisationModal from '@/components/POS/RepeatCustomisationModal'
import OrderDetailsModal from '@/components/POS/OrderDetailsModal'
import KitchenOrderTicket from '@/components/POS/KitchenOrderTicket'
import { useToast } from '@/components/ui/Toast'
import { fetchOrderDetails, createStoreCustomer, updateStoreCustomer, getApiCustomerFullName } from '@/lib/api/pos'
import type { ApiCustomer } from '@/lib/api/pos'
import type { Order } from '@/types/pos'

/** Full name for CustomerToEdit (newly added / modal) – used for matching and display; supports single name or name + last_name */
function getCustomerFullNameForEdit(c: { name?: string; last_name?: string }): string {
  const first = (c.name ?? '').trim()
  const last = (c.last_name ?? (c as Record<string, unknown>).lastName ?? (c as Record<string, unknown>).lastname ?? '').trim()
  return [first, last].filter(Boolean).join(' ').trim() || first
}

// Re-export types for backward compatibility
// This allows other files to import types directly from this page if needed
export type { OrderType, CartItem, Order } from '@/types/pos'

export default function POSPage() {
  const { showToast } = useToast()
  const posData = usePOSData()
  const [customerToEdit, setCustomerToEdit] = useState<CustomerToEdit | null>(null)
  /** Newly added customers (not yet in API list) so they appear in dropdown and can be selected */
  const [newlyAddedCustomers, setNewlyAddedCustomers] = useState<CustomerToEdit[]>([])
  const [selectedExecutionOrderId, setSelectedExecutionOrderId] = useState<string | null>(null)
  const [showExecutionOrders, setShowExecutionOrders] = useState(true)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null)
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [loadingOrderIntoCartId, setLoadingOrderIntoCartId] = useState<string | null>(null)
  // Mobile panel toggle state - only one panel visible on mobile
  const [mobileActivePanel, setMobileActivePanel] = useState<'products' | 'orders' | 'execution' | 'dashboard'>('products')
  // State for editing cart item with product modal
  const [editingCartItem, setEditingCartItem] = useState<{ item: import('@/types/pos').CartItem; product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] } } | null>(null)
  const {
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
    tables,
    numberOfPersons,
    setNumberOfPersons,
    handleTablesConfirm,
    discount,
    discountType,
    currentTime,
    addingToCart,
    
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
    
    // Computed values
    quickStats,
    subtotal,
    discountAmount,
    tax,
    taxRate,
    totalPayable,
    charge,
    setCharge,
    tips,
    setTips,
    
    // Actions
    addToCart,
    handleProductSelect,
    updateCartItem,
    updateCartItemFull,
    updateCartItemCustomization,
    removeFromCart,
    clearCart,
    handlePlaceOrder,
    handlePayment,
    handleApplyDiscount,
    handleCancelOrder,
    
    // Product options modal
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

    // Order modification
    handleUpdateOrder,
    loadOrderForModification,
    orderBeingModified,
    lastPlacedOrder,
    setLastPlacedOrder,
    orderToPay,
    setOrderToPay,
    lastPaidOrderForInvoice,
    setLastPaidOrderForInvoice,
    setOrdersFromApi,
  } = usePOS()

  // Sync display orders from API when POS data has loaded
  useEffect(() => {
    if (!posData.isLoading) {
      setOrdersFromApi(posData.displayOrders)
    }
  }, [posData.isLoading, posData.displayOrders, setOrdersFromApi])

  useEffect(() => {
    if (posData.error) {
      showToast(posData.error, 'error')
    }
  }, [posData.error, showToast])

  // After refetch, remove from newlyAddedCustomers when API has the same customer (by id or phone)
  useEffect(() => {
    if (posData.customers.length === 0) return
    setNewlyAddedCustomers((prev) =>
      prev.filter((p) => {
        const apiMatch = posData.customers.find(
          (c) => String(c.id) === String(p.id) || (c.phone != null && p.phone && c.phone === p.phone)
        )
        return !apiMatch
      })
    )
  }, [posData.customers])

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
  const paymentTotal = Math.max(0, Number(
    cartItems.length > 0 ? totalPayable : (orderToPay?.total ?? activeOrders[0]?.total ?? 0)
  ))

  const paymentBillSummary: BillSummaryValues = (() => {
    if (cartItems.length > 0) {
      return {
        mrp: subtotal + discountAmount,
        sellingPrice: subtotal,
        cgst: tax / 2,
        sgst: tax / 2,
        igst: 0,
        vat: 0,
        discount: discountAmount,
        charge,
        tips,
        payableAmount: totalPayable,
      }
    }
    const order = orderToPay ?? activeOrders[0]
    if (order) {
      const ot = order.total
      const oTax = order.tax ?? 0
      const oCharge = order.charge ?? 0
      const oTips = order.tips ?? 0
      const oDiscount = order.discount ?? 0
      const base = ot - oTax - oCharge - oTips
      return {
        mrp: base + oDiscount,
        sellingPrice: base,
        cgst: oTax / 2,
        sgst: oTax / 2,
        igst: 0,
        vat: 0,
        discount: oDiscount,
        charge: oCharge,
        tips: oTips,
        payableAmount: ot,
      }
    }
    return {
      mrp: 0,
      sellingPrice: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      vat: 0,
      discount: 0,
      charge: 0,
      tips: 0,
      payableAmount: 0,
    }
  })()

  // Handle window resize AND browser zoom - both change effective viewport
  useEffect(() => {
    let rafId: number
    const syncLayoutForViewport = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const width = window.innerWidth
        const isDesktop = width >= 1024
        if (isDesktop) {
          setShowExecutionOrders(true)
          setMobileActivePanel('products')
        } else {
          setMobileActivePanel((prev) => (prev === 'dashboard' ? 'products' : prev))
        }
      })
    }

    syncLayoutForViewport()
    window.addEventListener('resize', syncLayoutForViewport)
    window.visualViewport?.addEventListener('resize', syncLayoutForViewport)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', syncLayoutForViewport)
      window.visualViewport?.removeEventListener('resize', syncLayoutForViewport)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      // Toggle execution orders
      if (e.key === 'r' || e.key === 'R') {
        if (window.innerWidth < 1024) {
          setMobileActivePanel(mobileActivePanel === 'execution' ? 'products' : 'execution')
        } else {
          setShowExecutionOrders(prev => !prev)
        }
      }
      
      // Scroll to products (P key)
      if (e.key === 'p' || e.key === 'P') {
        if (window.innerWidth < 1024) {
          setMobileActivePanel('products')
        } else {
          const productPanel = document.getElementById('product-catalog-panel')
          if (productPanel) {
            productPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => {
              const searchInput = productPanel.querySelector('input[aria-label="Search products"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
              }
            }, 300)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mobileActivePanel])

  return (
    <AuthGuard>
    <div className="h-screen flex flex-col bg-gradient-pos min-h-screen overflow-hidden w-full">
      {/* Top Header with Action Buttons */}
      <div className="flex-shrink-0">
        <POSHeader
        quickStats={quickStats}
        currentTime={currentTime}
        showQuickStats={showQuickStats}
        showShortcuts={showShortcuts}
        showExecutionOrders={showExecutionOrders}
        onToggleQuickStats={() => setShowQuickStats(!showQuickStats)}
        onToggleExecutionOrders={() => setShowExecutionOrders(!showExecutionOrders)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onShowCustomerModal={() => {
          setCustomerToEdit(null)
          setShowCustomerModal(true)
        }}
        onScrollToProducts={() => {
          // Scroll to product catalog - optimized for all screen sizes
          const productPanel = document.getElementById('product-catalog-panel')
          if (productPanel) {
            // Smooth scroll to product panel
            productPanel.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            })
            
            // Focus search input after scroll completes
            setTimeout(() => {
              const searchInput = productPanel.querySelector('input[aria-label="Search products"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
                // On mobile, ensure input stays visible when keyboard appears
                if (window.innerWidth < 1024) {
                  setTimeout(() => {
                    searchInput.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    })
                  }, 150)
                }
              }
            }, 400)
          }
        }}
        />
      </div>

      {/* Mobile Dashboard Header - Only visible on mobile */}
      <div className="lg:hidden flex-shrink-0 bg-white border-b border-neutral-200 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-around px-2 py-3 gap-1">
          <button
            onClick={() => setMobileActivePanel('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] ${
              mobileActivePanel === 'dashboard'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
            }`}
            type="button"
            aria-label="Dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-semibold">Dashboard</span>
          </button>
          <button
            onClick={() => setMobileActivePanel('execution')}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] relative ${
              mobileActivePanel === 'execution'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
            }`}
            type="button"
            aria-label="Execution Orders"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-semibold">Orders</span>
            {quickStats.activeOrders > 0 && (
              <span className="absolute top-1 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {quickStats.activeOrders}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileActivePanel('orders')}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] relative ${
              mobileActivePanel === 'orders'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
            }`}
            type="button"
            aria-label="Cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs font-semibold">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-2 bg-accent-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileActivePanel('products')}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] ${
              mobileActivePanel === 'products'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
            }`}
            type="button"
            aria-label="Products"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-xs font-semibold">Products</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Three Panes: cart gets fixed width, product catalog takes the rest */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-0 isolate">
        {/* Left Sidebar - Execution Orders */}
        <div className={`lg:flex lg:flex-shrink-0 ${mobileActivePanel === 'execution' ? 'block' : 'hidden'}`}>
          {showExecutionOrders || mobileActivePanel === 'execution' ? (
            <ExecutionOrdersSidebar
              orders={orders}
              selectedOrderId={selectedExecutionOrderId}
              onSelectOrder={(orderId) => {
                setSelectedExecutionOrderId(orderId)
              }}
              onRefresh={async () => {
                await posData.refetch()
                showToast('Orders refreshed', 'success')
              }}
              onOrderDetails={async (order) => {
                setOrderDetailsLoading(true)
                try {
                  const { order: detailsOrder } = await fetchOrderDetails(order.id)
                  setSelectedOrderForDetails(detailsOrder)
                  setShowOrderDetailsModal(true)
                } catch (e) {
                  showToast('Failed to load order details', 'error')
                } finally {
                  setOrderDetailsLoading(false)
                }
              }}
              onReprintKOT={(order) => {
                setLastPlacedOrder(order)
              }}
              onInvoice={(order) => {
                setLastPlacedOrder(null)
                setOrderToPay(order)
                setShowPaymentModal(true)
              }}
              onAccount={(order) => {
                setLastPlacedOrder(null)
                setOrderToPay(order)
                setShowPaymentModal(true)
              }}
              onCancelOrder={(order) => {
                if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
                  handleCancelOrder(order.id)
                }
              }}
              orderDetailsLoading={orderDetailsLoading}
              onLoadOrderIntoCart={async (order) => {
                setLoadingOrderIntoCartId(order.id)
                try {
                  const { order: detailsOrder } = await fetchOrderDetails(order.id)
                  loadOrderForModification(detailsOrder)
                  showToast(`Order ${detailsOrder.orderNumber ?? order.id} loaded into cart`, 'success')
                  if (window.innerWidth < 1024) {
                    setMobileActivePanel('orders')
                  }
                } catch (e) {
                  showToast('Failed to load order into cart', 'error')
                } finally {
                  setLoadingOrderIntoCartId(null)
                }
              }}
              loadingOrderIntoCartId={loadingOrderIntoCartId}
              onClose={() => {
                setMobileActivePanel('products')
                setShowExecutionOrders(false)
              }}
            />
          ) : null}
        </div>

        {/* Center Panel - Order Management / Cart: larger width; product catalog gets the remainder */}
        <div className={`flex flex-col h-full lg:flex lg:flex-shrink-0 lg:w-[40rem] xl:w-[44rem] lg:min-w-[36rem] lg:max-w-[48rem] min-w-0 relative z-30 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.06)] ${mobileActivePanel === 'orders' || mobileActivePanel === 'dashboard' ? 'block' : 'hidden'}`}>
          {mobileActivePanel === 'dashboard' ? (
            // Dashboard View on Mobile
            <div className="h-full overflow-y-auto bg-white p-4 lg:hidden">
              <h2 className="text-xl font-bold text-neutral-800 mb-4">Dashboard</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <p className="text-xs font-semibold text-primary-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-bold text-primary-700">{quickStats.activeOrders}</p>
                </div>
                <div className="p-4 bg-success-50 rounded-xl border border-success-200">
                  <p className="text-xs font-semibold text-success-600 mb-1">Today's Revenue</p>
                  <p className="text-2xl font-bold text-success-700">₹{quickStats.todayRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
                  <p className="text-xs font-semibold text-accent-600 mb-1">Today's Orders</p>
                  <p className="text-2xl font-bold text-accent-700">{quickStats.todayOrders}</p>
                </div>
                <div className="p-4 bg-warning-50 rounded-xl border border-warning-200">
                  <p className="text-xs font-semibold text-warning-600 mb-1">Cart Items</p>
                  <p className="text-2xl font-bold text-warning-700">{quickStats.cartItems}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileActivePanel('orders')}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 active:bg-primary-700 transition-all touch-manipulation"
                type="button"
              >
                View Cart
              </button>
            </div>
          ) : (
            <OrderManagementPanel
              orderType={orderType}
              setOrderType={setOrderType}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              customer={customer}
              setCustomer={setCustomer}
              waiter={waiter}
              setWaiter={setWaiter}
              cartItems={cartItems}
              addingToCart={addingToCart}
              totalPayable={totalPayable}
              subtotal={subtotal}
              discount={discount}
              discountType={discountType}
              totalDiscount={discountAmount}
              tax={tax}
              charge={charge}
              tips={tips}
              taxRate={taxRate}
              isModifyingOrder={!!orderBeingModified}
              onUpdateQuantity={updateCartItem}
              onRemoveItem={removeFromCart}
              onUpdateCartItemFull={updateCartItemFull}
              onClearCart={clearCart}
              onCancelOrder={orderBeingModified ? () => {
                if (confirm(`Cancel order ${orderBeingModified.id}? This cannot be undone.`)) {
                  handleCancelOrder(orderBeingModified.id)
                }
              } : undefined}
              onShowPaymentModal={() => {
                setLastPlacedOrder(null)
                setShowPaymentModal(true)
              }}
              onPlaceOrder={() => {
                const waiterMatch = posData.waiters.find((w) => (w.name ?? String(w.id)) === waiter)
                const selectedName = customer.trim()
                // Only allow a real customer selected from the list – do NOT auto-fallback to Walk-in/default
                const apiMatch = posData.customers.find(
                  (c) => getApiCustomerFullName(c).toLowerCase() === selectedName.toLowerCase()
                )
                const newMatch = newlyAddedCustomers.find(
                  (c) => getCustomerFullNameForEdit(c).toLowerCase() === selectedName.toLowerCase()
                )
                const customerMatch = apiMatch ?? newMatch ?? null
                if (!waiterMatch || waiterMatch.id == null) {
                  showToast('Please select a waiter from the list.', 'error')
                  return
                }
                // Treat empty or default "Walk-in Customer" as "no customer selected"
                if (
                  !selectedName ||
                  selectedName.toLowerCase() === 'walk-in customer' ||
                  !customerMatch ||
                  customerMatch.id == null
                ) {
                  showToast('Please select a customer from the list.', 'error')
                  return
                }
                const waiterId = Number(waiterMatch.id)
                const customerId = Number(customerMatch.id)
                void handlePlaceOrder({ waiterId, customerId })
              }}
              onUpdateOrder={() => {
                if (!orderBeingModified) return
                const waiterMatch = posData.waiters.find((w) => (w.name ?? String(w.id)) === waiter)
                const selectedName = customer.trim()
                const apiMatch = posData.customers.find(
                  (c) => getApiCustomerFullName(c).toLowerCase() === selectedName.toLowerCase()
                )
                const newMatch = newlyAddedCustomers.find(
                  (c) => getCustomerFullNameForEdit(c).toLowerCase() === selectedName.toLowerCase()
                )
                const customerMatch = apiMatch ?? newMatch ?? null
                if (!waiterMatch || waiterMatch.id == null) {
                  showToast('Please select a waiter from the list.', 'error')
                  return
                }
                if (
                  !selectedName ||
                  selectedName.toLowerCase() === 'walk-in customer' ||
                  !customerMatch ||
                  customerMatch.id == null
                ) {
                  showToast('Please select a customer from the list.', 'error')
                  return
                }
                void handleUpdateOrder({
                  customerId: Number(customerMatch.id),
                  waiterId: Number(waiterMatch.id),
                })
              }}
              onShowCustomerModal={(customerToEdit) => {
                setCustomerToEdit(customerToEdit || null)
                setShowCustomerModal(true)
              }}
              onShowTableModal={() => setShowTableModal(true)}
              onUpdateDiscount={(value) => {
                handleApplyDiscount(value, 'percentage')
              }}
              onUpdateCharge={setCharge}
              onUpdateTips={setTips}
              onEditItemWithProductModal={(item, product) => {
                setEditingCartItem({ item, product })
                setProductToCustomize(product)
                setShowProductOptionsModal(true)
              }}
              waiterOptions={posData.waiters.map((w) => w.name ?? String(w.id))}
              apiCustomers={(() => {
                // Prefer name + last_name from newlyAdded when same customer exists in API (so dropdown shows full name after add)
                const merged = posData.customers.map((c) => {
                  const added = newlyAddedCustomers.find(
                    (n) => String(n.id) === String(c.id) || (n.phone && c.phone && n.phone === c.phone)
                  )
                  if (added)
                    return {
                      id: c.id,
                      name: added.name ?? '',
                      last_name: added.last_name ?? '',
                      phone: added.phone ?? c.phone ?? '',
                      email: c.email,
                    }
                  return {
                    id: c.id,
                    name: c.name ?? '',
                    last_name: c.last_name ?? '',
                    phone: c.phone ?? '',
                    email: c.email,
                  }
                })
                const addedOnly = newlyAddedCustomers.filter(
                  (n) =>
                    !posData.customers.some(
                      (c) => String(c.id) === String(n.id) || (c.phone != null && n.phone && c.phone === n.phone)
                    )
                ).map((n) => ({
                  id: n.id,
                  name: n.name ?? '',
                  last_name: n.last_name ?? '',
                  phone: n.phone ?? '',
                  email: n.email,
                }))
                return [...merged, ...addedOnly]
              })()}
            />
          )}
        </div>

        {/* Product Catalog: takes remaining space only, never overlaps cart */}
        <div className={`lg:flex lg:flex-1 lg:min-w-0 lg:overflow-hidden lg:relative lg:z-0 ${mobileActivePanel === 'products' ? 'block' : 'hidden'}`}>
          <ProductCatalogPanel
            onAddToCart={(product) => {
              addToCart(product)
              // usePOS addToCart already shows toast
            }}
            onProductSelect={handleProductSelect}
            getCartSummaryByProductId={getCartSummaryByProductId}
            onDecrementProductInCart={decrementProductInCart}
            products={posData.products}
            categories={posData.categories.map((c) => c.name)}
            categoryList={posData.categories}
            isLoading={posData.isLoading}
          />
        </div>
      </div>

      {/* Payment Modal - Finalize Sale - key forces fresh state when opening for a specific order */}
      {showPaymentModal && (
        <PaymentModal
          key={orderToPay ? `order-${orderToPay.id}` : 'cart'}
          payableAmount={paymentTotal}
          billSummary={paymentBillSummary}
          onClose={() => {
            setOrderToPay(null)
            setShowPaymentModal(false)
          }}
          onPayment={handlePayment}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <DiscountModal
          currentDiscount={discount}
          discountType={discountType}
          subtotal={subtotal}
          onClose={() => setShowDiscountModal(false)}
          onApply={handleApplyDiscount}
        />
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <AddCustomerModal
          isOpen={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false)
            setCustomerToEdit(null)
          }}
          customerToEdit={customerToEdit}
          onSubmit={async (data: AddCustomerFormData) => {
            const displayName = data.name.trim()
            if (!data.name?.trim() || !data.mobile?.trim()) {
              setShowCustomerModal(false)
              setCustomerToEdit(null)
              return
            }
            if (customerToEdit) {
              // Update existing customer via API
              try {
                await updateStoreCustomer(customerToEdit.id, {
                  name: data.name.trim(),
                  mobile: data.mobile.trim(),
                })
                setNewlyAddedCustomers((prev) =>
                  prev.map((c) =>
                    c.id === customerToEdit.id || c.phone === customerToEdit.phone
                      ? {
                          ...c,
                          name: data.name.trim(),
                          phone: data.mobile.trim(),
                        }
                      : c
                  )
                )
                setCustomer(displayName)
                showToast(`Customer "${displayName}" updated successfully`, 'success')
                await posData.refetch()
              } catch (error: unknown) {
                const message = error && typeof error === 'object' && 'message' in error
                  ? String((error as { message: unknown }).message)
                  : 'Failed to update customer'
                showToast(message, 'error')
                return
              }
            } else {
              // Add new customer via API – then show in dropdown without page reload (refetch + local state)
              try {
                const res = await createStoreCustomer({
                  name: data.name.trim(),
                  mobile: data.mobile.trim(),
                })
                const rawData = (res?.data ?? res) as Record<string, unknown> | undefined
                // Support nested response e.g. { data: { customer: { id, name, ... } } }
                const customerObj =
                  rawData && typeof rawData.customer === 'object'
                    ? (rawData.customer as Record<string, unknown>)
                    : rawData
                const id = customerObj?.id != null ? String(customerObj.id) : `CUST-${Date.now()}`
                const respName = String(customerObj?.name ?? customerObj?.first_name ?? customerObj?.firstName ?? '').trim()
                const newCustomer: CustomerToEdit = {
                  id,
                  name: data.name.trim() || respName,
                  phone: data.mobile.trim() || String(customerObj?.mobile ?? customerObj?.phone ?? ''),
                }
                // 1) Add to local state so dropdown shows new customer immediately (no page reload)
                setNewlyAddedCustomers((prev) => {
                  const exists = prev.some(
                    (c) =>
                      c.phone === newCustomer.phone ||
                      getCustomerFullNameForEdit(c).toLowerCase() === getCustomerFullNameForEdit(newCustomer).toLowerCase()
                  )
                  if (exists) return prev
                  return [...prev, newCustomer]
                })
                setCustomer(displayName)
                showToast(`Customer "${displayName}" added successfully`, 'success')
                // 2) Refetch all customers from API so dropdown stays in sync without reloading the page
                await posData.refetch()
              } catch (error: unknown) {
                const message = error && typeof error === 'object' && 'message' in error
                  ? String((error as { message: unknown }).message)
                  : 'Failed to add customer'
                showToast(message, 'error')
                return
              }
            }
            setShowCustomerModal(false)
            setCustomerToEdit(null)
          }}
        />
      )}

      {/* Tables Modal – Select Area, Tables (multiple), Seat Capacity, Number of Persons */}
      <TablesModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        selectedTable={selectedTable}
        tables={tables}
        initialNumberOfPersons={numberOfPersons}
        onConfirm={(tableNames, persons) => {
          handleTablesConfirm(tableNames, persons)
          showToast(
            tableNames.length > 0
              ? `${tableNames.join(', ')} selected${persons > 0 ? ` • ${persons} person(s)` : ''}`
              : 'Tables cleared',
            'success'
          )
          setShowTableModal(false)
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Product Options Modal */}
      <ProductOptionsModal
        isOpen={showProductOptionsModal}
        product={productToCustomize}
        editingCartItem={editingCartItem?.item}
        onClose={() => {
          setShowProductOptionsModal(false)
          setProductToCustomize(null)
          setEditingCartItem(null)
        }}
        onAddToCart={(item) => {
          if (editingCartItem) {
            // Save changes only to that cart item (Swiggy-style: no new line)
            updateCartItemCustomization(editingCartItem.item.lineItemId, item)
            setEditingCartItem(null)
            showToast(`${item.name} updated in cart`, 'success')
          } else {
            addToCart(item)
          }
          setShowProductOptionsModal(false)
          setProductToCustomize(null)
        }}
      />

      {/* Repeat previous customisation? modal (when adding more of same product from catalog) */}
      <RepeatCustomisationModal
        isOpen={showRepeatCustomisationModal}
        productName={repeatCustomisationContext?.product.name ?? ''}
        customizationSummary={
          repeatCustomisationContext?.cartItem
            ? [
                repeatCustomisationContext.cartItem.selectedSize,
                ...(repeatCustomisationContext.cartItem.modifiers?.map((m) => m.name) ?? []),
              ]
                .filter(Boolean)
                .join(' • ') || 'Default'
            : ''
        }
        onClose={closeRepeatCustomisationModal}
        onRepeat={repeatCustomisationAddOne}
        onIllChoose={openProductOptionsFromRepeat}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => {
          setShowOrderDetailsModal(false)
          setSelectedOrderForDetails(null)
        }}
        order={selectedOrderForDetails}
        onCreateInvoiceAndClose={() => {
          if (selectedOrderForDetails) {
            showToast(`Generating invoice for order ${selectedOrderForDetails.id}`, 'info')
          }
        }}
      />

      {/* Invoice / Bill - Show full bill after payment for viewing and printing */}
      {lastPaidOrderForInvoice && (
        <InvoiceBillModal
          order={lastPaidOrderForInvoice}
          onClose={() => setLastPaidOrderForInvoice(null)}
        />
      )}

      {/* Kitchen Order Ticket - Show modal immediately after placing order (when no payment / not showing invoice) */}
      {lastPlacedOrder && !lastPaidOrderForInvoice && (
        <KitchenOrderTicket
          order={lastPlacedOrder}
          autoPrint={false}
          autoDownload={false}
          onPrintComplete={() => {
            setLastPlacedOrder(null)
          }}
        />
      )}
    </div>
    </AuthGuard>
  )
}
