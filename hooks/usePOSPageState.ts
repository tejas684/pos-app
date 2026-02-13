/**
 * Local UI state for the POS page (modals, mobile panel, execution sidebar, etc.).
 * Keeps app/page.tsx focused on composition while state lives here.
 */

'use client'

import { useState } from 'react'
import type { CartItem, Order } from '@/types/pos'
import type { CustomerToEdit } from '@/components/POS/AddCustomerModal'

export type MobileActivePanel = 'products' | 'orders' | 'execution' | 'dashboard'

export interface EditingCartItemProduct {
  id: string
  name: string
  price: number
  category?: string
  image?: string
  sizes?: { id: string; name: string; price: number }[]
  modifiers?: { id: string; name: string; price: number }[]
}

export interface EditingCartItem {
  item: CartItem
  product: EditingCartItemProduct
}

export function usePOSPageState() {
  const [customerToEdit, setCustomerToEdit] = useState<CustomerToEdit | null>(null)
  const [newlyAddedCustomers, setNewlyAddedCustomers] = useState<CustomerToEdit[]>([])
  const [selectedExecutionOrderId, setSelectedExecutionOrderId] = useState<string | null>(null)
  const [showExecutionOrders, setShowExecutionOrders] = useState(true)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null)
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [loadingOrderIntoCartId, setLoadingOrderIntoCartId] = useState<string | null>(null)
  const [mobileActivePanel, setMobileActivePanel] = useState<MobileActivePanel>('products')
  const [editingCartItem, setEditingCartItem] = useState<EditingCartItem | null>(null)

  return {
    customerToEdit,
    setCustomerToEdit,
    newlyAddedCustomers,
    setNewlyAddedCustomers,
    selectedExecutionOrderId,
    setSelectedExecutionOrderId,
    showExecutionOrders,
    setShowExecutionOrders,
    showOrderDetailsModal,
    setShowOrderDetailsModal,
    selectedOrderForDetails,
    setSelectedOrderForDetails,
    orderDetailsLoading,
    setOrderDetailsLoading,
    loadingOrderIntoCartId,
    setLoadingOrderIntoCartId,
    mobileActivePanel,
    setMobileActivePanel,
    editingCartItem,
    setEditingCartItem,
  }
}
