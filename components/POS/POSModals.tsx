'use client'

import PaymentModal from '@/components/POS/PaymentModal'
import InvoiceBillModal from '@/components/POS/InvoiceBillModal'
import DiscountModal from '@/components/POS/DiscountModal'
import AddCustomerModal from '@/components/POS/AddCustomerModal'
import type { AddCustomerFormData, CustomerToEdit } from '@/components/POS/AddCustomerModal'
import TablesModal from '@/components/POS/TablesModal'
import ProductOptionsModal from '@/components/POS/ProductOptionsModal'
import RepeatCustomisationModal from '@/components/POS/RepeatCustomisationModal'
import OrderDetailsModal from '@/components/POS/OrderDetailsModal'
import KitchenOrderTicket from '@/components/POS/KitchenOrderTicket'
import type { Order, CartItem } from '@/types/pos'
import type { BillSummaryValues } from '@/components/POS/PaymentModal'

export interface POSModalsProps {
  showPaymentModal: boolean
  orderToPay: Order | null
  cartItems: CartItem[]
  cartContext: { customerName: string; tableName?: string; waiter?: string; orderType?: string } | undefined
  paymentTotal: number
  paymentBillSummary: BillSummaryValues
  onClosePayment: () => void
  onPayment: (payment: import('@/types/pos').OrderPayment) => void

  showDiscountModal: boolean
  discount: number
  discountType: 'percentage' | 'fixed'
  subtotal: number
  onCloseDiscount: () => void
  onApplyDiscount: (value: number, type: 'percentage' | 'fixed') => void

  showCustomerModal: boolean
  customerToEdit: CustomerToEdit | null
  onCloseCustomer: () => void
  onCustomerSubmit: (data: AddCustomerFormData) => Promise<void>

  showTableModal: boolean
  selectedTable: string
  tables: import('@/types/pos').Table[]
  numberOfPersons: number
  onCloseTable: () => void
  onTablesConfirm: (tableNames: string[], persons: number) => void

  showProductOptionsModal: boolean
  productToCustomize: { id: string; name: string; price: number; category?: string; image?: string; sizes?: { id: string; name: string; price: number }[]; modifiers?: { id: string; name: string; price: number }[] } | null
  editingCartItem: CartItem | null
  onCloseProductOptions: () => void
  onProductOptionsAddToCart: (item: { id: string; name: string; price: number; quantity: number; category?: string; image?: string; modifiers?: { name: string; price: number }[]; notes?: string; selectedSize?: string }) => void

  showRepeatCustomisationModal: boolean
  repeatProductName: string
  repeatCustomizationSummary: string
  onCloseRepeatCustomisation: () => void
  onRepeatCustomisationRepeat: () => void
  onRepeatCustomisationIllChoose: () => void

  showOrderDetailsModal: boolean
  selectedOrderForDetails: Order | null
  onCloseOrderDetails: () => void
  onCreateInvoiceFromDetails: () => void

  lastPaidOrderForInvoice: Order | null
  onCloseInvoice: () => void

  lastPlacedOrder: Order | null
  onKitchenTicketPrintComplete: () => void
}

export default function POSModals({
  showPaymentModal,
  orderToPay,
  cartItems,
  cartContext,
  paymentTotal,
  paymentBillSummary,
  onClosePayment,
  onPayment,

  showDiscountModal,
  discount,
  discountType,
  subtotal,
  onCloseDiscount,
  onApplyDiscount,

  showCustomerModal,
  customerToEdit,
  onCloseCustomer,
  onCustomerSubmit,

  showTableModal,
  selectedTable,
  tables,
  numberOfPersons,
  onCloseTable,
  onTablesConfirm,

  showProductOptionsModal,
  productToCustomize,
  editingCartItem,
  onCloseProductOptions,
  onProductOptionsAddToCart,

  showRepeatCustomisationModal,
  repeatProductName,
  repeatCustomizationSummary,
  onCloseRepeatCustomisation,
  onRepeatCustomisationRepeat,
  onRepeatCustomisationIllChoose,

  showOrderDetailsModal,
  selectedOrderForDetails,
  onCloseOrderDetails,
  onCreateInvoiceFromDetails,

  lastPaidOrderForInvoice,
  onCloseInvoice,

  lastPlacedOrder,
  onKitchenTicketPrintComplete,
}: POSModalsProps) {
  return (
    <>
      {showPaymentModal && (
        <PaymentModal
          key={orderToPay ? `order-${orderToPay.id}` : 'cart'}
          order={orderToPay}
          cartItems={cartItems}
          cartContext={cartContext}
          payableAmount={paymentTotal}
          billSummary={paymentBillSummary}
          onClose={onClosePayment}
          onPayment={onPayment}
        />
      )}

      {showDiscountModal && (
        <DiscountModal
          currentDiscount={discount}
          discountType={discountType}
          subtotal={subtotal}
          onClose={onCloseDiscount}
          onApply={onApplyDiscount}
        />
      )}

      {showCustomerModal && (
        <AddCustomerModal
          isOpen={showCustomerModal}
          onClose={onCloseCustomer}
          customerToEdit={customerToEdit}
          onSubmit={onCustomerSubmit}
        />
      )}

      <TablesModal
        isOpen={showTableModal}
        onClose={onCloseTable}
        selectedTable={selectedTable}
        tables={tables}
        initialNumberOfPersons={numberOfPersons}
        onConfirm={(tableNames, persons) => {
          onTablesConfirm(tableNames, persons)
          onCloseTable()
        }}
      />

      <ProductOptionsModal
        isOpen={showProductOptionsModal}
        product={productToCustomize}
        editingCartItem={editingCartItem}
        onClose={onCloseProductOptions}
        onAddToCart={onProductOptionsAddToCart}
      />

      <RepeatCustomisationModal
        isOpen={showRepeatCustomisationModal}
        productName={repeatProductName}
        customizationSummary={repeatCustomizationSummary}
        onClose={onCloseRepeatCustomisation}
        onRepeat={onRepeatCustomisationRepeat}
        onIllChoose={onRepeatCustomisationIllChoose}
      />

      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={onCloseOrderDetails}
        order={selectedOrderForDetails}
        onCreateInvoiceAndClose={onCreateInvoiceFromDetails}
      />

      {lastPaidOrderForInvoice && (
        <InvoiceBillModal order={lastPaidOrderForInvoice} onClose={onCloseInvoice} />
      )}

      {lastPlacedOrder && !lastPaidOrderForInvoice && (
        <KitchenOrderTicket
          order={lastPlacedOrder}
          autoPrint={false}
          autoDownload={false}
          onPrintComplete={onKitchenTicketPrintComplete}
        />
      )}
    </>
  )
}
