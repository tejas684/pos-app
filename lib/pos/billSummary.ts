/**
 * Payment bill summary computation for POS.
 * Builds BillSummaryValues for PaymentModal from either cart state or an existing order.
 */

import type { Order } from '@/types/pos'
import type { BillSummaryValues } from '@/components/POS/PaymentModal'

export interface CartBillSummaryInput {
  subtotal: number
  discountAmount: number
  tax: number
  totalPayable: number
  charge: number
  tips: number
}

/**
 * Build bill summary from cart totals (when paying from current cart).
 */
export function getBillSummaryFromCart(input: CartBillSummaryInput): BillSummaryValues {
  const { subtotal, discountAmount, tax, totalPayable, charge, tips } = input
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

/**
 * Build bill summary from an existing order (when paying an order from execution list).
 */
export function getBillSummaryFromOrder(order: Order): BillSummaryValues {
  const ot = order.total
  const oCharge = order.charge ?? 0
  const oTips = order.tips ?? 0
  const oDiscount = order.discount ?? 0
  const base = ot - oCharge - oTips
  return {
    mrp: base + oDiscount,
    sellingPrice: base,
    cgst: 0,
    sgst: 0,
    igst: 0,
    vat: 0,
    discount: oDiscount,
    charge: oCharge,
    tips: oTips,
    payableAmount: ot,
  }
}

const EMPTY_BILL_SUMMARY: BillSummaryValues = {
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

/**
 * Get payment bill summary: from cart if cart has items, else from orderToPay or first active order.
 */
export function getPaymentBillSummary(
  hasCartItems: boolean,
  cartInput: CartBillSummaryInput | null,
  orderToPay: Order | null,
  activeOrders: Order[]
): BillSummaryValues {
  if (hasCartItems && cartInput) {
    return getBillSummaryFromCart(cartInput)
  }
  const order = orderToPay ?? activeOrders[0] ?? null
  if (order) {
    return getBillSummaryFromOrder(order)
  }
  return EMPTY_BILL_SUMMARY
}
