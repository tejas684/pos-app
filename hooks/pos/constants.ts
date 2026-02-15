/**
 * POS constants used across hooks (storage key, stale threshold, tax).
 */

export const POS_ORDERS_KEY = 'pos_orders'

export const STALE_ORDER_HOURS = 12

/** Tax disabled – discount only. */
export const TAX_RATE = 0

/** Per-person charge (₹20) – applied at order placement, shown in invoice/order details only. */
export const CHARGE_PER_PERSON = 20
