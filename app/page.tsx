/**
 * ============================================================================
 * POS MAIN PAGE (app/page.tsx)
 * ============================================================================
 *
 * Orchestrates POS UI: header, mobile tab bar, main content (sidebar + order + catalog), and modals.
 * Business logic lives in usePOS (hooks/usePOS.ts); page-specific UI state in usePOSPageState.
 */

'use client'

import AuthGuard from '@/components/AuthGuard'
import { usePOS } from '@/hooks/usePOS'
import { usePOSData } from '@/contexts/POSDataContext'
import { usePOSPageState } from '@/hooks/usePOSPageState'
import { useToast } from '@/components/ui/Toast'
import POSHeader from '@/components/POS/POSHeader'
import POSMobileTabBar from '@/components/POS/POSMobileTabBar'
import POSMainContent from '@/components/POS/POSMainContent'
import POSModals from '@/components/POS/POSModals'
import { createStoreCustomer, updateStoreCustomer, getApiCustomerFullName } from '@/lib/api/pos'
import type { AddCustomerFormData, CustomerToEdit } from '@/components/POS/AddCustomerModal'
import { getCustomerFullNameForEdit } from '@/lib/pos/customerUtils'
import { getPaymentBillSummary } from '@/lib/pos/billSummary'
import { validateWaiterAndCustomer } from '@/lib/pos/orderValidation'
import usePOSPageEffects from '@/hooks/usePOSPageEffects'

export type { OrderType, CartItem, Order } from '@/types/pos'

export default function POSPage() {
  const { showToast } = useToast()
  const posData = usePOSData()
  const pageState = usePOSPageState()

  const {
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
    handleTablesConfirm,
    discount,
    discountType,
    currentTime,
    addingToCart,
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
    quickStats,
    subtotal,
    discountAmount,
    tax,
    taxRate,
    totalPayable,
    tips,
    setTips,
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
    showProductOptionsModal,
    setShowProductOptionsModal,
    productToCustomize,
    setProductToCustomize,
    showRepeatCustomisationModal,
    repeatCustomisationContext,
    getCartSummaryByProductId,
    decrementProductInCart,
    repeatCustomisationAddOne,
    openProductOptionsFromRepeat,
    closeRepeatCustomisationModal,
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

  usePOSPageEffects({
    posData,
    showToast,
    setOrdersFromApi,
    setNewlyAddedCustomers: pageState.setNewlyAddedCustomers,
    setShowExecutionOrders: pageState.setShowExecutionOrders,
    setMobileActivePanel: pageState.setMobileActivePanel,
    mobileActivePanel: pageState.mobileActivePanel,
  })

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
  const paymentTotal = Math.max(
    0,
    Number(cartItems.length > 0 ? totalPayable : orderToPay?.total ?? activeOrders[0]?.total ?? 0)
  )
  const paymentBillSummary = getPaymentBillSummary(
    cartItems.length > 0,
    cartItems.length > 0 ? { subtotal, discountAmount, tax, totalPayable, tips } : null,
    orderToPay,
    activeOrders
  )

  const apiCustomers = (() => {
    const merged = posData.customers.map((c) => {
      const added = pageState.newlyAddedCustomers.find(
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
    const addedOnly = pageState.newlyAddedCustomers
      .filter(
        (n) =>
          !posData.customers.some(
            (c) => String(c.id) === String(n.id) || (c.phone != null && n.phone && c.phone === n.phone)
          )
      )
      .map((n) => ({
        id: n.id,
        name: n.name ?? '',
        last_name: n.last_name ?? '',
        phone: n.phone ?? '',
        email: n.email,
      }))
    return [...merged, ...addedOnly]
  })()

  const onPlaceOrder = () => {
    const validated = validateWaiterAndCustomer(
      posData,
      pageState.newlyAddedCustomers,
      waiter,
      customer,
      showToast
    )
    if (validated) void handlePlaceOrder({ waiterId: validated.waiterId, customerId: validated.customerId })
  }

  const onUpdateOrder = () => {
    if (!orderBeingModified) return
    const validated = validateWaiterAndCustomer(
      posData,
      pageState.newlyAddedCustomers,
      waiter,
      customer,
      showToast
    )
    if (validated)
      void handleUpdateOrder({ customerId: validated.customerId, waiterId: validated.waiterId })
  }

  const handleCustomerSubmit = async (data: AddCustomerFormData) => {
    const displayName = data.name.trim()
    if (!data.name?.trim() || !data.mobile?.trim()) {
      setShowCustomerModal(false)
      pageState.setCustomerToEdit(null)
      return
    }
    if (pageState.customerToEdit) {
      try {
        await updateStoreCustomer(pageState.customerToEdit.id, {
          name: data.name.trim(),
          mobile: data.mobile.trim(),
        })
        pageState.setNewlyAddedCustomers((prev) =>
          prev.map((c) =>
            c.id === pageState.customerToEdit?.id || c.phone === pageState.customerToEdit?.phone
              ? { ...c, name: data.name.trim(), phone: data.mobile.trim() }
              : c
          )
        )
        setCustomer(displayName)
        showToast(`Customer "${displayName}" updated successfully`, 'success')
        await posData.refetch()
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Failed to update customer'
        showToast(message, 'error')
        return
      }
    } else {
      try {
        const res = await createStoreCustomer({
          name: data.name.trim(),
          mobile: data.mobile.trim(),
        })
        const rawData = (res?.data ?? res) as Record<string, unknown> | undefined
        const customerObj =
          rawData && typeof rawData.customer === 'object'
            ? (rawData.customer as Record<string, unknown>)
            : rawData
        const id = customerObj?.id != null ? String(customerObj.id) : `CUST-${Date.now()}`
        const respName = String(
          customerObj?.name ?? customerObj?.first_name ?? customerObj?.firstName ?? ''
        ).trim()
        const newCustomer: CustomerToEdit = {
          id,
          name: data.name.trim() || respName,
          phone: data.mobile.trim() || String(customerObj?.mobile ?? customerObj?.phone ?? ''),
        }
        pageState.setNewlyAddedCustomers((prev) => {
          const exists = prev.some(
            (c) =>
              c.phone === newCustomer.phone ||
              getCustomerFullNameForEdit(c).toLowerCase() ===
                getCustomerFullNameForEdit(newCustomer).toLowerCase()
          )
          if (exists) return prev
          return [...prev, newCustomer]
        })
        setCustomer(displayName)
        showToast(`Customer "${displayName}" added successfully`, 'success')
        await posData.refetch()
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Failed to add customer'
        showToast(message, 'error')
        return
      }
    }
    setShowCustomerModal(false)
    pageState.setCustomerToEdit(null)
  }

  return (
    <AuthGuard>
      <div className="pos-root flex flex-col h-full min-h-0 w-full overflow-hidden bg-gradient-pos">
        <div className="flex-shrink-0 w-full min-h-0 shrink-0">
          <POSHeader
            quickStats={quickStats}
            currentTime={currentTime}
            showQuickStats={showQuickStats}
            showExecutionOrders={pageState.showExecutionOrders}
            onToggleQuickStats={() => setShowQuickStats(!showQuickStats)}
            onToggleExecutionOrders={() => pageState.setShowExecutionOrders(!pageState.showExecutionOrders)}
            onShowCustomerModal={() => {
              pageState.setCustomerToEdit(null)
              setShowCustomerModal(true)
            }}
          />
        </div>

        <POSMobileTabBar
          activePanel={pageState.mobileActivePanel}
          onSelectPanel={pageState.setMobileActivePanel}
          activeOrdersCount={quickStats.activeOrders}
          cartItemsCount={cartItems.length}
        />

        <POSMainContent
          posData={posData}
          showToast={showToast}
          mobileActivePanel={pageState.mobileActivePanel}
          setMobileActivePanel={pageState.setMobileActivePanel}
          showExecutionOrders={pageState.showExecutionOrders}
          setShowExecutionOrders={pageState.setShowExecutionOrders}
          selectedExecutionOrderId={pageState.selectedExecutionOrderId}
          setSelectedExecutionOrderId={pageState.setSelectedExecutionOrderId}
          orderDetailsLoading={pageState.orderDetailsLoading}
          setOrderDetailsLoading={pageState.setOrderDetailsLoading}
          setShowOrderDetailsModal={pageState.setShowOrderDetailsModal}
          setSelectedOrderForDetails={pageState.setSelectedOrderForDetails}
          loadingOrderIntoCartId={pageState.loadingOrderIntoCartId}
          setLoadingOrderIntoCartId={pageState.setLoadingOrderIntoCartId}
          setCustomerToEdit={pageState.setCustomerToEdit}
          setShowCustomerModal={setShowCustomerModal}
          setEditingCartItem={pageState.setEditingCartItem}
          setProductToCustomize={setProductToCustomize}
          setShowProductOptionsModal={setShowProductOptionsModal}
          setLastPlacedOrder={setLastPlacedOrder}
          setOrderToPay={setOrderToPay}
          setShowPaymentModal={setShowPaymentModal}
          orders={orders}
          tables={tables}
          quickStats={quickStats}
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
          discountAmount={discountAmount}
          tax={tax}
          tips={tips}
          taxRate={taxRate}
          orderBeingModified={orderBeingModified}
          updateCartItem={updateCartItem}
          removeFromCart={removeFromCart}
          updateCartItemFull={updateCartItemFull}
          clearCart={clearCart}
          handleCancelOrder={handleCancelOrder}
          onPlaceOrder={onPlaceOrder}
          onUpdateOrder={onUpdateOrder}
          loadOrderForModification={loadOrderForModification}
          handleProductSelect={handleProductSelect}
          addToCart={addToCart}
          getCartSummaryByProductId={getCartSummaryByProductId}
          decrementProductInCart={decrementProductInCart}
          setShowTableModal={setShowTableModal}
          handleApplyDiscount={handleApplyDiscount}
          setTips={setTips}
          newlyAddedCustomers={pageState.newlyAddedCustomers}
          apiCustomers={apiCustomers}
        />

        <POSModals
          showPaymentModal={showPaymentModal}
          orderToPay={orderToPay}
          cartItems={cartItems}
          cartContext={
            !orderToPay && cartItems.length > 0
              ? {
                  customerName: customer || '—',
                  tableName: selectedTable || undefined,
                  waiter: waiter || undefined,
                  orderType: orderType || 'dine-in',
                }
              : undefined
          }
          paymentTotal={paymentTotal}
          paymentBillSummary={paymentBillSummary}
          onClosePayment={() => {
            setOrderToPay(null)
            setShowPaymentModal(false)
          }}
          onPayment={handlePayment}
          showDiscountModal={showDiscountModal}
          discount={discount}
          discountType={discountType}
          subtotal={subtotal}
          onCloseDiscount={() => setShowDiscountModal(false)}
          onApplyDiscount={handleApplyDiscount}
          showCustomerModal={showCustomerModal}
          customerToEdit={pageState.customerToEdit}
          onCloseCustomer={() => {
            setShowCustomerModal(false)
            pageState.setCustomerToEdit(null)
          }}
          onCustomerSubmit={handleCustomerSubmit}
          showTableModal={showTableModal}
          selectedTable={selectedTable}
          tables={tables}
          numberOfPersons={numberOfPersons}
          onCloseTable={() => setShowTableModal(false)}
          onTablesConfirm={(tableNames, persons) => {
            handleTablesConfirm(tableNames, persons)
            showToast(
              tableNames.length > 0
                ? `${tableNames.join(', ')} selected${persons > 0 ? ` • ${persons} person(s)` : ''}`
                : 'Tables cleared',
              'success'
            )
          }}
          showProductOptionsModal={showProductOptionsModal}
          productToCustomize={productToCustomize}
          editingCartItem={pageState.editingCartItem?.item ?? null}
          onCloseProductOptions={() => {
            setShowProductOptionsModal(false)
            setProductToCustomize(null)
            pageState.setEditingCartItem(null)
          }}
          onProductOptionsAddToCart={(item) => {
            if (pageState.editingCartItem) {
              updateCartItemCustomization(pageState.editingCartItem.item.lineItemId, item)
              pageState.setEditingCartItem(null)
              showToast(`${item.name} updated in cart`, 'success')
            } else {
              addToCart(item)
            }
            setShowProductOptionsModal(false)
            setProductToCustomize(null)
          }}
          showRepeatCustomisationModal={showRepeatCustomisationModal}
          repeatProductName={repeatCustomisationContext?.product.name ?? ''}
          repeatCustomizationSummary={
            repeatCustomisationContext?.cartItem
              ? [
                  repeatCustomisationContext.cartItem.selectedSize,
                  ...(repeatCustomisationContext.cartItem.modifiers?.map((m) => m.name) ?? []),
                ]
                  .filter(Boolean)
                  .join(' • ') || 'Default'
              : ''
          }
          onCloseRepeatCustomisation={closeRepeatCustomisationModal}
          onRepeatCustomisationRepeat={repeatCustomisationAddOne}
          onRepeatCustomisationIllChoose={openProductOptionsFromRepeat}
          showOrderDetailsModal={pageState.showOrderDetailsModal}
          selectedOrderForDetails={pageState.selectedOrderForDetails}
          onCloseOrderDetails={() => {
            pageState.setShowOrderDetailsModal(false)
            pageState.setSelectedOrderForDetails(null)
          }}
          onCreateInvoiceFromDetails={() => {
            if (pageState.selectedOrderForDetails) {
              showToast(`Generating invoice for order ${pageState.selectedOrderForDetails.id}`, 'info')
            }
          }}
          lastPaidOrderForInvoice={lastPaidOrderForInvoice}
          onCloseInvoice={() => setLastPaidOrderForInvoice(null)}
          lastPlacedOrder={lastPlacedOrder}
          onKitchenTicketPrintComplete={() => setLastPlacedOrder(null)}
        />
      </div>
    </AuthGuard>
  )
}
