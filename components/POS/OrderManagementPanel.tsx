'use client'

import { useState, useMemo } from 'react'
import type { OrderType, CartItem, Order, Table } from '@/types/pos'
import type { CustomerToEdit } from './AddCustomerModal'
import CustomerWaiterInfo from './CustomerWaiterInfo'
import OrderItemsTable from './OrderItemsTable'
import OrderSummary from './OrderSummary'

interface Product {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: { id: string; name: string; price: number }[]
  modifiers?: { id: string; name: string; price: number }[]
}

interface OrderManagementPanelProps {
  orderType: OrderType
  setOrderType: (type: OrderType) => void
  selectedTable: string
  tables?: Table[]
  setSelectedTable: (table: string) => void
  customer: string
  setCustomer: (customer: string) => void
  waiter: string
  setWaiter: (waiter: string) => void
  cartItems: CartItem[]
  addingToCart: string | null
  totalPayable: number
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed'
  totalDiscount: number
  tax: number
  tips: number
  taxRate?: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onUpdateCartItemFull: (
    id: string,
    updates: { quantity: number; discount?: number; discountType?: 'percentage' | 'fixed'; notes?: string }
  ) => void
  onClearCart: () => void
  onCancelOrder?: () => void
  onPlaceOrder: () => void
  onUpdateOrder?: () => void
  isModifyingOrder?: boolean
  onShowCustomerModal: (customerToEdit?: CustomerToEdit | null) => void
  onShowTableModal: () => void
  onUpdateDiscount: (value: number) => void
  onUpdateTips: (value: number) => void
  onEditItemWithProductModal?: (item: CartItem, product: Product) => void
  waiterOptions?: string[]
  apiCustomers?: CustomerToEdit[]
  /** Order loaded for modification – enables Details, KOT, Invoice, Cancel order in cart */
  orderForActions?: Order | null
  /** When null, the four action buttons (Details, KOT, Invoice, Cancel ord.) are disabled */
  selectedExecutionOrderId?: string | null
  orderDetailsLoading?: boolean
  onOrderDetails?: (order: Order) => void
  onReprintKOT?: (order: Order) => void
  onInvoice?: (order: Order) => void
  onCancelExecutionOrder?: (order: Order) => void
}

export default function OrderManagementPanel({
  orderType,
  setOrderType,
  selectedTable,
  tables = [],
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
  totalDiscount,
  tax,
  tips,
  taxRate = 10,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCartItemFull,
  onClearCart,
  onCancelOrder,
  onPlaceOrder,
  onUpdateOrder,
  isModifyingOrder = false,
  onShowCustomerModal,
  onShowTableModal,
  onUpdateDiscount,
  onUpdateTips,
  onEditItemWithProductModal,
  waiterOptions,
  apiCustomers,
  orderForActions = null,
  selectedExecutionOrderId = null,
  orderDetailsLoading = false,
  onOrderDetails,
  onReprintKOT,
  onInvoice,
  onCancelExecutionOrder,
}: OrderManagementPanelProps) {
  /** Display one table with area for the cart button (e.g. "Garden - Table 1") */
  const tableDisplayForCart = useMemo(() => {
    if (!selectedTable.trim()) return ''
    const firstTableName = selectedTable.split(',')[0].trim()
    if (!firstTableName) return selectedTable
    const table = tables.find(
      (t) => t.name === firstTableName || t.name.toLowerCase() === firstTableName.toLowerCase()
    )
    if (table?.area?.trim()) return `${table.area} – ${table.name}`
    return table?.name ?? firstTableName
  }, [selectedTable, tables])

  const handleEditItem = (item: CartItem) => {
    if (onEditItemWithProductModal) {
      // Reconstruct product from cart item
      // Default sizes - will be used if product doesn't have sizes
      const defaultSizes = [
        { id: 'default', name: 'Default', price: item.price },
        { id: 'medium', name: 'Medium', price: 180 },
        { id: 'large', name: 'Large', price: 220 },
        { id: 'xlarge', name: 'Extra Large', price: 260 },
      ]
      
      const product: Product = {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image,
        sizes: defaultSizes,
        modifiers: item.modifiers?.map((m, idx) => ({
          id: `mod-${idx}`,
          name: m.name,
          price: m.price,
        })),
      }
      onEditItemWithProductModal(item, product)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-r border-neutral-200 shadow-soft min-w-0 w-full md:w-full overflow-hidden relative z-10 md:overflow-x-hidden">
      {/* Order Type Tabs - always visible */}
      <div className="flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-neutral-200 bg-neutral-50/50 flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-hide">
        <button
          onClick={() => {
            setOrderType('dine-in')
            setSelectedTable('')
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 min-h-[32px] sm:min-h-0 touch-manipulation shrink-0 ${
            orderType === 'dine-in'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 hover:text-neutral-800'
          }`}
        >
          Dine in
        </button>
        <button
          onClick={() => {
            setOrderType('take-away')
            setSelectedTable('')
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 min-h-[32px] sm:min-h-0 touch-manipulation shrink-0 ${
            orderType === 'take-away'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 hover:text-neutral-800'
          }`}
        >
          Takeaway
        </button>
        <button
          onClick={() => {
            setOrderType('delivery')
            setSelectedTable('')
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 min-h-[32px] sm:min-h-0 touch-manipulation shrink-0 ${
            orderType === 'delivery'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 hover:text-neutral-800'
          }`}
        >
          Delivery
        </button>
        {orderType === 'dine-in' && (
          <button
            onClick={onShowTableModal}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 min-h-[32px] sm:min-h-0 touch-manipulation shrink-0 ${
              selectedTable
                ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 hover:text-neutral-800'
            }`}
            title={selectedTable ? `${tableDisplayForCart || selectedTable} – click to change` : 'Select table for this order'}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {selectedTable ? (
              <span className="font-semibold">{tableDisplayForCart || selectedTable}</span>
            ) : (
              <span>Select Table</span>
            )}
          </button>
        )}
      </div>

      {/* Customer & Waiter Info - always visible, never hidden by catalog */}
      <div className="flex-shrink-0">
        <CustomerWaiterInfo
        customer={customer}
        waiter={waiter}
        onCustomerChange={setCustomer}
        onWaiterChange={setWaiter}
        onShowCustomerModal={onShowCustomerModal}
        waiterOptions={waiterOptions}
        apiCustomers={apiCustomers}
      />
      </div>

      {/* Order Items Table */}
      <OrderItemsTable
        cartItems={cartItems}
        addingToCart={addingToCart}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onEditItem={handleEditItem}
      />

      {/* Bottom Action Bar - always visible */}
      <div className="flex-shrink-0">
        <OrderSummary
        totalPayable={totalPayable}
        cartItemsCount={cartItems.length}
        subtotal={subtotal}
        discount={discount}
        discountType={discountType}
        totalDiscount={totalDiscount}
        tax={tax}
        tips={tips}
        cartItems={cartItems}
        taxRate={taxRate}
        isModifyingOrder={isModifyingOrder}
        selectedTable={selectedTable || undefined}
        onClearCart={onClearCart}
        onPlaceOrder={onPlaceOrder}
        onUpdateOrder={onUpdateOrder}
        onUpdateDiscount={onUpdateDiscount}
        onUpdateTips={onUpdateTips}
        orderForActions={orderForActions}
        selectedExecutionOrderId={selectedExecutionOrderId}
        orderDetailsLoading={orderDetailsLoading}
        onOrderDetails={onOrderDetails}
        onReprintKOT={onReprintKOT}
        onInvoice={onInvoice}
        onCancelExecutionOrder={onCancelExecutionOrder}
      />
      </div>
    </div>
  )
}
