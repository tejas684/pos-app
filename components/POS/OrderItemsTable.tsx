'use client'

import type { CartItem } from '@/types/pos'

interface OrderItemsTableProps {
  cartItems: CartItem[]
  addingToCart: string | null
  onUpdateQuantity: (lineItemId: string, quantity: number) => void
  onRemoveItem: (lineItemId: string) => void
  onEditItem?: (item: CartItem) => void
  readOnly?: boolean
}

export default function OrderItemsTable({
  cartItems,
  addingToCart,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  readOnly = false,
}: OrderItemsTableProps) {
  const hasItems = cartItems.length > 0
  return (
    <div className={`flex-1 min-h-0 ${hasItems ? 'overflow-y-auto overflow-x-hidden scrollbar-hide' : 'overflow-hidden'}`}>
      <div className="p-3 sm:p-5 min-w-0">
        <div className="min-w-0 overflow-x-hidden">
          <table className="w-full min-w-0 table-fixed">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="w-[34%] px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Product</th>
                <th className="w-[16%] px-1 sm:px-2 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Price</th>
                <th className="w-[20%] px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Qty.</th>
                <th className="w-[14%] px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Disc.</th>
                <th className="w-[16%] px-1 sm:px-2 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200">
            {cartItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-sm font-medium">No items in cart</p>
                  </div>
                </td>
              </tr>
            ) : (
              cartItems.map((item) => {
                // Calculate item price: base price + modifiers
                // item.price is the base price (may include size price if selected)
                // modifiers are added separately
                const modifierTotal = item.modifiers?.reduce((sum, m) => sum + m.price, 0) || 0
                const itemPrice = item.price + modifierTotal
                const lineTotal = itemPrice * item.quantity
                // Apply item-level discount (percentage)
                const itemDiscount = (() => {
                  if (!item.discount || item.discount <= 0) return 0
                  return (lineTotal * item.discount) / 100
                })()
                // Round to 2 decimal places for accurate display
                const itemTotal = Math.round((lineTotal - itemDiscount) * 100) / 100
                const discountLabel = itemDiscount > 0
                  ? `${item.discount}%`
                  : '-'
                return (
                  <tr key={item.lineItemId} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all animate-in fade-in slide-in-from-left-2">
                    <td className="px-2 sm:px-3 py-3 align-top overflow-hidden">
                      <div className="font-semibold text-sm text-gray-900 flex items-center gap-2 min-w-0">
                        <span className="truncate" title={item.name}>{item.name}</span>
                        {addingToCart === item.id && (
                          <span className="text-xs text-success-600 animate-pulse">✓ Added</span>
                        )}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.modifiers.map(m => m.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-1 sm:px-2 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap">₹{itemPrice.toFixed(2)}</td>
                    <td className="px-1 sm:px-2 py-2 sm:py-3">
                      {readOnly ? (
                        <span className="text-sm font-bold text-center block">{item.quantity}</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2 sm:gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.lineItemId, item.quantity - 1)}
                            className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 hover:border-primary-300 active:border-primary-400 transition-all touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-sm sm:text-sm font-bold w-8 sm:w-8 text-center min-w-[32px]">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.lineItemId, item.quantity + 1)}
                            className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 hover:border-primary-300 active:border-primary-400 transition-all touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-1 sm:px-2 py-2 sm:py-3 text-center">
                      {readOnly ? (
                        <span className="text-xs text-gray-600">{discountLabel}</span>
                      ) : (
                        <button
                          onClick={() => onEditItem && onEditItem(item)}
                          className="px-2 sm:px-2 py-1.5 sm:py-1 text-xs sm:text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[36px] sm:min-h-0 touch-manipulation"
                          aria-label="Edit discount"
                        >
                          {itemDiscount > 0 ? `${item.discount}%` : 'Amt'}
                        </button>
                      )}
                    </td>
                    <td className="px-1 sm:px-2 py-2 sm:py-3 text-right">
                      {readOnly ? (
                        <span className="text-sm font-bold text-gray-900">₹{itemTotal.toFixed(2)}</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2 sm:gap-2">
                          <span className="text-sm sm:text-sm font-bold text-gray-900">₹{itemTotal.toFixed(2)}</span>
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item)}
                              className="text-primary-600 hover:text-primary-700 active:text-primary-800 p-2 sm:p-1 hover:bg-primary-50 active:bg-primary-100 rounded-lg transition-all min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 touch-manipulation flex items-center justify-center"
                              title="Edit item"
                              aria-label="Edit item"
                            >
                              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveItem(item.lineItemId)}
                            className="text-danger-600 hover:text-danger-700 active:text-danger-800 p-2 sm:p-1 hover:bg-danger-50 active:bg-danger-100 rounded-lg transition-all min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 touch-manipulation flex items-center justify-center"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
