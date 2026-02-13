/**
 * Pure calculation helpers for POS (subtotal, discount, total).
 */

import type { CartItem } from '@/types/pos'

export const round2 = (n: number) => Math.round(n * 100) / 100

export function computeSubtotal(cartItems: CartItem[]): number {
  const sum = cartItems.reduce((acc, item) => {
    const itemPrice = item.price + (item.modifiers?.reduce((mSum, mod) => mSum + mod.price, 0) || 0)
    const lineTotal = itemPrice * item.quantity
    const itemDiscount = !item.discount || item.discount <= 0
      ? 0
      : (lineTotal * item.discount) / 100
    return acc + round2(lineTotal - itemDiscount)
  }, 0)
  return round2(sum)
}

export function computeDiscountAmount(subtotal: number, discountPercent: number): number {
  const clampedDiscount = Math.max(0, Math.min(100, discountPercent))
  return round2((subtotal * clampedDiscount) / 100)
}

export function computeTotalPayable(
  subtotal: number,
  discountAmount: number,
  charge: number,
  tips: number
): number {
  const safeCharge = Math.max(0, charge)
  const safeTips = Math.max(0, tips)
  const base = Math.max(0, subtotal - discountAmount)
  return round2(base + safeCharge + safeTips)
}
