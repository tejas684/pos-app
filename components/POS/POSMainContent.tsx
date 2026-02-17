'use client'

import { useMemo } from 'react'
import ExecutionOrdersSidebar from '@/components/POS/ExecutionOrdersSidebar'
import OrderManagementPanel from '@/components/POS/OrderManagementPanel'
import { type QuickStats } from '@/components/POS/POSMobileDashboard'
import ProductCatalogPanel from '@/components/POS/ProductCatalogPanel'
import { fetchOrderDetails } from '@/lib/api/pos'
import type { Order } from '@/types/pos'
import { usePOSData } from '@/contexts/POSDataContext'
import type { MobileActivePanel } from '@/hooks/usePOSPageState'

type POSData = ReturnType<typeof usePOSData>
import type { CustomerToEdit } from '@/components/POS/AddCustomerModal'

export interface POSMainContentProps {
  posData: POSData
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  mobileActivePanel: MobileActivePanel
  setMobileActivePanel: (panel: MobileActivePanel) => void
  showExecutionOrders: boolean
  setShowExecutionOrders: (v: boolean) => void
  selectedExecutionOrderId: string | null
  setSelectedExecutionOrderId: (id: string | null) => void
  orderDetailsLoading: boolean
  setOrderDetailsLoading: (v: boolean) => void
  setShowOrderDetailsModal: (v: boolean) => void
  setSelectedOrderForDetails: (order: Order | null) => void
  loadingOrderIntoCartId: string | null
  setLoadingOrderIntoCartId: (id: string | null) => void
  setCustomerToEdit: (c: CustomerToEdit | null) => void
  setShowCustomerModal: (v: boolean) => void
  setEditingCartItem: (v: { item: import('@/types/pos').CartItem; product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] } } | null) => void
  setProductToCustomize: (p: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] } | null) => void
  setShowProductOptionsModal: (v: boolean) => void
  setLastPlacedOrder: (order: Order | null) => void
  setOrderToPay: (order: Order | null) => void
  setShowPaymentModal: (v: boolean) => void
  orders: Order[]
  tables: import('@/types/pos').Table[]
  quickStats: QuickStats
  orderType: import('@/types/pos').OrderType
  setOrderType: (t: import('@/types/pos').OrderType) => void
  selectedTable: string
  setSelectedTable: (t: string) => void
  customer: string
  setCustomer: (c: string) => void
  waiter: string
  setWaiter: (w: string) => void
  cartItems: import('@/types/pos').CartItem[]
  addingToCart: string | null
  totalPayable: number
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed'
  discountAmount: number
  tax: number
  tips: number
  taxRate: number
  orderBeingModified: Order | null | undefined
  updateCartItem: (lineItemId: string, quantity: number) => void
  removeFromCart: (lineItemId: string) => void
  updateCartItemFull: (
    lineItemId: string,
    updates: { quantity: number; discount?: number; discountType?: 'percentage' | 'fixed'; notes?: string }
  ) => void
  clearCart: () => void
  handleCancelOrder: (orderId: string) => void
  onPlaceOrder: () => void
  onUpdateOrder: () => void
  loadOrderForModification: (order: Order) => void
  handleProductSelect: (product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => void
  addToCart: (product: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] }) => void
  getCartSummaryByProductId: (productId: string) => { totalQuantity: number; lastItem: import('@/types/pos').CartItem | undefined }
  decrementProductInCart: (productId: string) => void
  setShowTableModal: (v: boolean) => void
  handleApplyDiscount: (value: number, type: 'percentage' | 'fixed') => void
  setTips: (v: number) => void
  newlyAddedCustomers: CustomerToEdit[]
  apiCustomers: CustomerToEdit[]
}

export default function POSMainContent({
  posData,
  showToast,
  mobileActivePanel,
  setMobileActivePanel,
  showExecutionOrders,
  setShowExecutionOrders,
  selectedExecutionOrderId,
  setSelectedExecutionOrderId,
  orderDetailsLoading,
  setOrderDetailsLoading,
  setShowOrderDetailsModal,
  setSelectedOrderForDetails,
  loadingOrderIntoCartId,
  setLoadingOrderIntoCartId,
  setCustomerToEdit,
  setShowCustomerModal,
  setEditingCartItem,
  setProductToCustomize,
  setShowProductOptionsModal,
  setLastPlacedOrder,
  setOrderToPay,
  setShowPaymentModal,
  orders,
  tables,
  quickStats,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  customer,
  setCustomer,
  waiter,
  setWaiter,
  cartItems,
  addingToCart,
  totalPayable,
  subtotal,
  discount,
  discountType,
  discountAmount,
  tax,
  tips,
  taxRate,
  orderBeingModified,
  updateCartItem,
  removeFromCart,
  updateCartItemFull,
  clearCart,
  handleCancelOrder,
  onPlaceOrder,
  onUpdateOrder,
  loadOrderForModification,
  handleProductSelect,
  addToCart,
  getCartSummaryByProductId,
  decrementProductInCart,
  setShowTableModal,
  handleApplyDiscount,
  setTips,
  apiCustomers,
}: POSMainContentProps) {
  const selectedExecutionOrder = useMemo(
    () => (selectedExecutionOrderId ? orders.find((o) => o.id === selectedExecutionOrderId) ?? null : null),
    [orders, selectedExecutionOrderId]
  )
  const orderForActions = orderBeingModified ?? selectedExecutionOrder ?? null

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 w-full overflow-hidden gap-0 shrink-0">
      {/* Left: Execution Orders sidebar */}
      <div className={`${mobileActivePanel === 'execution' ? 'block' : 'hidden'} ${showExecutionOrders ? 'md:!flex md:flex-[0_0_260px] md:min-w-0 md:shrink-0 md:overflow-hidden' : 'md:hidden'}`}>
        {showExecutionOrders || mobileActivePanel === 'execution' ? (
          <ExecutionOrdersSidebar
            orders={orders}
            tables={tables}
            selectedOrderId={selectedExecutionOrderId}
            onSelectOrder={setSelectedExecutionOrderId}
            onRefresh={async () => {
              await posData.refetch()
              showToast('Orders refreshed', 'success')
            }}
            onLoadOrderIntoCart={async (order) => {
              setLoadingOrderIntoCartId(order.id)
              try {
                const { order: detailsOrder } = await fetchOrderDetails(order.id)
                loadOrderForModification(detailsOrder)
                showToast(`Order ${detailsOrder.orderNumber ?? order.id} loaded into cart`, 'success')
                if (window.innerWidth < 768) {
                  setMobileActivePanel('orders')
                }
              } catch {
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

      {/* Cart + Product catalog — cart gets more width at 100% zoom, catalog to the right */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 gap-0">
        <div className={`flex flex-col h-full min-w-0 md:!flex md:flex-[1_1_58%] md:min-w-[380px] md:max-w-[62%] md:shrink-0 relative bg-white border-r border-neutral-200 shadow-soft overflow-hidden ${mobileActivePanel === 'orders' ? 'block' : 'hidden'}`}>
          <OrderManagementPanel
              orderType={orderType}
              setOrderType={setOrderType}
              selectedTable={selectedTable}
              tables={tables}
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
              onPlaceOrder={onPlaceOrder}
              onUpdateOrder={onUpdateOrder}
              onShowCustomerModal={(c) => {
                setCustomerToEdit(c || null)
                setShowCustomerModal(true)
              }}
              onShowTableModal={() => setShowTableModal(true)}
              onUpdateDiscount={(value) => handleApplyDiscount(value, 'percentage')}
              onUpdateTips={setTips}
              onEditItemWithProductModal={(item, product) => {
                setEditingCartItem({ item, product })
                setProductToCustomize(product)
                setShowProductOptionsModal(true)
              }}
              waiterOptions={posData.waiters.map((w) => w.name ?? String(w.id))}
              apiCustomers={apiCustomers}
              orderForActions={orderForActions}
              selectedExecutionOrderId={selectedExecutionOrderId}
              orderDetailsLoading={orderDetailsLoading}
              onOrderDetails={async (order) => {
                setOrderDetailsLoading(true)
                try {
                  const { order: detailsOrder } = await fetchOrderDetails(order.id)
                  setSelectedOrderForDetails(detailsOrder)
                  setShowOrderDetailsModal(true)
                } catch {
                  showToast('Failed to load order details', 'error')
                } finally {
                  setOrderDetailsLoading(false)
                }
              }}
              onReprintKOT={async (order) => {
                // Use same KOT modal as after order placed: open KitchenOrderTicket with full order
                try {
                  const { order: detailsOrder } = await fetchOrderDetails(order.id)
                  setLastPlacedOrder(detailsOrder)
                } catch {
                  showToast('Failed to load order for KOT', 'error')
                }
              }}
              onInvoice={async (order) => {
                setLastPlacedOrder(null)
                setOrderToPay(order)
                setShowPaymentModal(true)
                if ((order.items ?? []).length === 0) {
                  try {
                    const { order: detailsOrder } = await fetchOrderDetails(order.id)
                    setOrderToPay(detailsOrder)
                  } catch {
                    showToast('Could not load order details', 'error')
                  }
                }
              }}
              onCancelExecutionOrder={(order) => {
                if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
                  handleCancelOrder(order.id)
                  setSelectedExecutionOrderId(null)
                  clearCart()
                }
              }}
            />
        </div>

        <div className={`flex flex-col min-w-0 flex-1 min-h-0 overflow-hidden md:!flex md:flex-[0_1_42%] md:min-w-[280px] md:overflow-hidden ${mobileActivePanel === 'products' ? 'flex' : 'hidden'}`}>
          <ProductCatalogPanel
            onAddToCart={(product) => addToCart(product)}
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
    </div>
  )
}
