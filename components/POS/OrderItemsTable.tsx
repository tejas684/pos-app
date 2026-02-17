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
    <div className={`flex-1 min-h-0 ${hasItems ? 'overflow-y-auto overflow-x-auto scrollbar-hide' : 'overflow-hidden'}`}>
      <div className="p-2 min-w-0 text-xs">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[360px] table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[14%]" />
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-primary-50/70 sticky top-0 border-b border-primary-200/60">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-primary-800">Item</th>
                <th className="px-1 py-1.5 text-right text-[10px] font-semibold text-primary-800">Price</th>
                <th className="px-1 py-1.5 text-center text-[10px] font-semibold text-primary-800">Qty</th>
                <th className="px-1 py-1.5 text-center text-[10px] font-semibold text-primary-800">Discount</th>
                <th className="px-1 py-1.5 text-right text-[10px] font-semibold text-primary-800">Total</th>
                <th className="px-1 py-1.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100/80 bg-white">
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 bg-neutral-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-xs font-medium">No items in cart</p>
                    </div>
                  </td>
                </tr>
              ) : (
                cartItems.map((item) => {
                  const modifierTotal = item.modifiers?.reduce((sum, m) => sum + m.price, 0) || 0
                  const itemPrice = item.price + modifierTotal
                  const lineTotal = itemPrice * item.quantity
                  const itemDiscount = (() => {
                    if (!item.discount || item.discount <= 0) return 0
                    return (lineTotal * item.discount) / 100
                  })()
                  const itemTotal = Math.round((lineTotal - itemDiscount) * 100) / 100
                  const hasDiscount = itemDiscount > 0
                  return (
                    <tr key={item.lineItemId} className="hover:bg-primary-50/40 transition-colors">
                      <td className="px-2 py-1.5 align-top overflow-hidden min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-0.5 rounded text-neutral-500 hover:text-primary-600 hover:bg-primary-50 shrink-0 touch-manipulation"
                              title="Edit item"
                              aria-label="Edit item"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-xs text-neutral-900 truncate" title={item.name}>
                              {item.name}
                              {addingToCart === item.id && (
                                <span className="text-[10px] text-green-600 animate-pulse ml-1">✓</span>
                              )}
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[10px] text-neutral-500 truncate">{item.modifiers.map(m => m.name).join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-right text-xs text-neutral-700 whitespace-nowrap align-top">₹{itemPrice.toFixed(2)}</td>
                      <td className="px-1 py-1.5 align-top">
                        {readOnly ? (
                          <span className="text-xs font-semibold text-center block">{item.quantity}</span>
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.lineItemId, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-primary-200 flex items-center justify-center hover:bg-primary-50 text-primary-600 touch-manipulation transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-xs font-semibold w-5 text-center min-w-[20px]">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.lineItemId, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-primary-200 flex items-center justify-center hover:bg-primary-50 text-primary-600 touch-manipulation transition-colors"
                              aria-label="Increase quantity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-1 py-1.5 text-center align-top">
                        {readOnly ? (
                          <span className="text-[10px] text-neutral-600">{hasDiscount ? `${item.discount}%` : '—'}</span>
                        ) : (
                          <button
                            onClick={() => onEditItem && onEditItem(item)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-lg transition-colors touch-manipulation ${
                              hasDiscount
                                ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 text-neutral-500'
                            }`}
                            aria-label="Discount"
                          >
                            {hasDiscount ? `${item.discount}%` : 'Amt'}
                          </button>
                        )}
                      </td>
                      <td className="px-1 py-1.5 text-right text-xs font-semibold text-neutral-900 whitespace-nowrap align-top">₹{itemTotal.toFixed(2)}</td>
                      <td className="px-1 py-1.5 align-top text-right">
                        <div className="flex justify-end">
                        {!readOnly && (
                          <button
                            onClick={() => onRemoveItem(item.lineItemId)}
                            className="w-5 h-5 rounded-full bg-danger-500 hover:bg-danger-600 text-white flex items-center justify-center transition-colors touch-manipulation shrink-0 shadow-sm"
                            aria-label="Remove item"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        </div>
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
