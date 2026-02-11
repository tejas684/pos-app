/**
 * ============================================================================
 * POS TYPE DEFINITIONS (types/pos.ts)
 * ============================================================================
 * 
 * This file contains all TypeScript type definitions for the POS system.
 * Type safety ensures that data structures are consistent throughout the app.
 * 
 * Type Definitions:
 * 1. OrderType - The three types of orders the system supports
 * 2. CartItem - Structure for items in the shopping cart
 * 3. Order - Complete order structure with all order details
 * 4. Table - Table information for floor plan management
 * 
 * Benefits of TypeScript:
 * - Compile-time error checking
 * - IntelliSense/autocomplete in IDE
 * - Self-documenting code
 * - Refactoring safety
 */

/**
 * OrderType
 * 
 * Defines the three types of orders supported by the POS system:
 * - 'dine-in': Customer eats at the restaurant (requires table selection)
 * - 'take-away': Customer picks up order to go
 * - 'delivery': Order is delivered to customer's address
 */
export type OrderType = 'dine-in' | 'take-away' | 'delivery'

/**
 * CartItemCustomization (snapshot)
 *
 * Customization is stored per cart item, NOT on the product.
 * A cart item is uniquely identified by: productId + this snapshot.
 */
export interface CartItemCustomization {
  selectedSize?: string
  modifiers: { name: string; price: number }[]
  notes?: string
}

/**
 * CartItem Interface
 *
 * Represents an item in the shopping cart. Customization (size, modifiers, notes)
 * is stored as a snapshot on the item; it is NOT saved on the product.
 * Two cart lines are the "same" only if productId and customization snapshot match.
 */
export interface CartItem {
  /** Product ID (same product can appear in multiple lines with different customization) */
  id: string
  /** Unique ID for this line item (same product + different customization = different line) */
  lineItemId: string
  name: string
  /** Unit price (base or size price; modifiers are in modifiers[].price) */
  price: number
  quantity: number
  category?: string
  image?: string
  /** Add-ons/modifiers snapshot (stored on cart item only) */
  modifiers?: { name: string; price: number }[]
  notes?: string
  /** Per-item discount value (percentage 0–100 or fixed amount) */
  discount?: number
  /** Whether discount is percentage or fixed amount */
  discountType?: 'percentage' | 'fixed'
  /** Selected size name (snapshot on cart item only) */
  selectedSize?: string
}

/**
 * Get customization snapshot from a cart item (for comparison / identity).
 */
export function getCartItemCustomization(item: CartItem): CartItemCustomization {
  const notes = typeof item.notes === 'string' ? item.notes.trim() : undefined
  return {
    selectedSize: item.selectedSize ?? undefined,
    modifiers: [...(item.modifiers ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    notes: notes === '' ? undefined : notes,
  }
}

/**
 * Compare two customization snapshots (order of modifiers normalized by name).
 */
function normalizeNotes(notes: string | undefined): string {
  if (notes == null) return ''
  return String(notes).trim()
}

export function areCartItemCustomizationsEqual(
  a: CartItemCustomization,
  b: CartItemCustomization
): boolean {
  if (normalizeNotes(a.notes) !== normalizeNotes(b.notes)) return false
  if ((a.selectedSize ?? '') !== (b.selectedSize ?? '')) return false
  if (a.modifiers.length !== b.modifiers.length) return false
  const aMods = [...a.modifiers].sort((x, y) => x.name.localeCompare(y.name))
  const bMods = [...b.modifiers].sort((x, y) => x.name.localeCompare(y.name))
  return aMods.every((m, i) => m.name === bMods[i].name && m.price === bMods[i].price)
}

/**
 * Check if two cart items represent the same "customization" (same product + same size, modifiers, notes).
 * Used to decide: merge quantity vs create a new line item.
 */
export function areCartItemsIdentical(a: CartItem, b: CartItem): boolean {
  if (a.id !== b.id) return false
  return areCartItemCustomizationsEqual(
    getCartItemCustomization(a),
    getCartItemCustomization(b)
  )
}

/**
 * Order Interface
 * 
 * Represents a complete order in the system with all necessary information:
 * - id: Unique order identifier (format: "ORD-{timestamp}")
 * - tableId/tableName: Table information (only for dine-in orders)
 * - orderType: Type of order (dine-in, take-away, or delivery)
 * - customer: Customer name or identifier
 * - items: Array of CartItems in this order
 * - status: Current status in the order lifecycle
 * - total: Final total amount to be paid
 * - discount: Optional discount amount applied
 * - tax: Optional tax amount calculated
 * - createdAt: Timestamp when order was created
 * - waiter: Optional waiter assigned to the order
 * 
 * Order Status Flow:
 * pending → preparing → ready → served → completed
 * Orders can also be cancelled at any stage
 */
/** Card details captured for card payments (stored with order, not processed). */
export interface OrderPaymentCardDetails {
  cardNumber: string
  cardHolderName: string
  expiryMonth: string
  expiryYear: string
  cvc: string
}

/** Payment info saved with the order when sale is finalized. */
export interface OrderPayment {
  method: 'cash' | 'card'
  amount: number
  change?: number
  cardDetails?: OrderPaymentCardDetails
}

export interface Order {
  id: string
  /** Human-readable order number from API (e.g. mJH250210-001). Shown on KOT. */
  orderNumber?: string
  tableId?: string
  tableName?: string
  orderType: OrderType
  customer: string
  items: CartItem[]
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  total: number
  discount?: number
  tax?: number
  charge?: number
  tips?: number
  createdAt: Date
  waiter?: string
  /** Set when order is paid/completed via Finalize Sale. */
  payment?: OrderPayment
}

/**
 * Table Interface
 * 
 * Represents a table in the restaurant floor plan:
 * - id: Unique table identifier
 * - name: Display name (e.g., "Table 1", "Booth 5")
 * - capacity: Maximum number of guests the table can accommodate
 * - status: Current availability status
 * - x, y: Coordinates for positioning on the floor plan visualization
 * - currentOrderId: Optional reference to the active order at this table
 */
export interface Table {
  id: string
  name: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  x: number
  y: number
  currentOrderId?: string
  /** Area/floor for filtering (e.g. "Garden", "Hall") */
  area?: string
}
