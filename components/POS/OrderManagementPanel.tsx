'use client'

import { useState } from 'react'
import type { OrderType, CartItem } from '@/types/pos'
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
  charge: number
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
  onShowPaymentModal: () => void
  onPlaceOrder: () => void
  onUpdateOrder?: () => void
  isModifyingOrder?: boolean
  onShowCustomerModal: (customerToEdit?: CustomerToEdit | null) => void
  onShowTableModal: () => void
  onUpdateDiscount: (value: number) => void
  onUpdateCharge: (value: number) => void
  onUpdateTips: (value: number) => void
  onEditItemWithProductModal?: (item: CartItem, product: Product) => void
  waiterOptions?: string[]
  apiCustomers?: CustomerToEdit[]
}

export default function OrderManagementPanel({
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
  totalDiscount,
  tax,
  charge,
  tips,
  taxRate = 10,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCartItemFull,
  onClearCart,
  onCancelOrder,
  onShowPaymentModal,
  onPlaceOrder,
  onUpdateOrder,
  isModifyingOrder = false,
  onShowCustomerModal,
  onShowTableModal,
  onUpdateDiscount,
  onUpdateCharge,
  onUpdateTips,
  onEditItemWithProductModal,
  waiterOptions,
  apiCustomers,
}: OrderManagementPanelProps) {
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
            title={selectedTable ? `${selectedTable} – click to change` : 'Select table for this order'}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {selectedTable ? (
              <span className="font-semibold">{selectedTable}</span>
            ) : (
              <span>Select Table</span>
            )}
          </button>
        )}
      </div>

      {/* Table number badge – show when dine-in and table is selected - always visible */}
      {orderType === 'dine-in' && selectedTable && (
        <div className="flex-shrink-0 px-2 sm:px-5 py-1.5 flex items-center gap-2 bg-primary-50 border-b border-primary-100">
          <span className="text-xs font-medium text-primary-700 uppercase tracking-wide">Order for</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-bold shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {selectedTable}
          </span>
          <button
            type="button"
            onClick={onShowTableModal}
            className="text-xs font-medium text-primary-600 hover:text-primary-800 underline"
          >
            Change
          </button>
        </div>
      )}

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
        charge={charge}
        tips={tips}
        cartItems={cartItems}
        taxRate={taxRate}
        isModifyingOrder={isModifyingOrder}
        selectedTable={selectedTable || undefined}
        onClearCart={onClearCart}
        onShowPaymentModal={onShowPaymentModal}
        onPlaceOrder={onPlaceOrder}
        onUpdateOrder={onUpdateOrder}
        onUpdateDiscount={onUpdateDiscount}
        onUpdateCharge={onUpdateCharge}
        onUpdateTips={onUpdateTips}
      />
      </div>
    </div>
  )
}
