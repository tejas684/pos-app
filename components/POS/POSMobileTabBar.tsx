'use client'

/**
 * Mobile tab bar for POS: Orders (execution), Cart, Products.
 * Only visible below md (768px); hidden on desktop.
 */

export interface POSMobileTabBarProps {
  activePanel: 'products' | 'orders' | 'execution'
  onSelectPanel: (panel: 'products' | 'orders' | 'execution') => void
  activeOrdersCount: number
  cartItemsCount: number
}

export default function POSMobileTabBar({
  activePanel,
  onSelectPanel,
  activeOrdersCount,
  cartItemsCount,
}: POSMobileTabBarProps) {
  const tab = (panel: 'products' | 'orders' | 'execution', label: string, icon: React.ReactNode, badge?: number) => {
    const isActive = activePanel === panel
    return (
      <button
        onClick={() => onSelectPanel(panel)}
        className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] relative ${
          isActive
            ? 'bg-primary-500 text-white shadow-lg'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
        }`}
        type="button"
        aria-label={label}
      >
        {icon}
        <span className="text-xs font-semibold">{label}</span>
        {badge != null && badge > 0 && (
          <span className="absolute top-1 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>
    )
  }

  const cartBadge = cartItemsCount > 0 ? (
    <span className="absolute top-1 right-2 bg-accent-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
      {cartItemsCount}
    </span>
  ) : null

  return (
    <div className="flex-shrink-0 w-full min-w-0 bg-white border-b border-neutral-200 shadow-md z-30 flex flex-col md:hidden">
      <div className="flex items-center justify-around px-2 py-3 gap-1 w-full">
        {tab(
          'execution',
          'Orders',
          (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          activeOrdersCount
        )}
        <button
          onClick={() => onSelectPanel('orders')}
          className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all touch-manipulation min-h-[60px] relative ${
            activePanel === 'orders'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300'
          }`}
          type="button"
          aria-label="Cart"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-xs font-semibold">Cart</span>
          {cartBadge}
        </button>
        {tab(
          'products',
          'Products',
          (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )
        )}
      </div>
    </div>
  )
}
