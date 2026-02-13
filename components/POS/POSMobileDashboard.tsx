'use client'

/**
 * Mobile dashboard view for POS: quick stats (active orders, revenue, today's orders, cart items).
 * Shown when mobile tab "Dashboard" is selected.
 */

export interface QuickStats {
  activeOrders: number
  todayRevenue: number
  todayOrders: number
  cartItems: number
}

export interface POSMobileDashboardProps {
  quickStats: QuickStats
  onViewCart: () => void
}

export default function POSMobileDashboard({ quickStats, onViewCart }: POSMobileDashboardProps) {
  return (
    <div className="h-full overflow-y-auto bg-white p-4 md:hidden">
      <h2 className="text-xl font-bold text-neutral-800 mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
          <p className="text-xs font-semibold text-primary-600 mb-1">Active Orders</p>
          <p className="text-2xl font-bold text-primary-700">{quickStats.activeOrders}</p>
        </div>
        <div className="p-4 bg-success-50 rounded-xl border border-success-200">
          <p className="text-xs font-semibold text-success-600 mb-1">Today&apos;s Revenue</p>
          <p className="text-2xl font-bold text-success-700">₹{quickStats.todayRevenue.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
          <p className="text-xs font-semibold text-accent-600 mb-1">Today&apos;s Orders</p>
          <p className="text-2xl font-bold text-accent-700">{quickStats.todayOrders}</p>
        </div>
        <div className="p-4 bg-warning-50 rounded-xl border border-warning-200">
          <p className="text-xs font-semibold text-warning-600 mb-1">Cart Items</p>
          <p className="text-2xl font-bold text-warning-700">{quickStats.cartItems}</p>
        </div>
      </div>
      <button
        onClick={onViewCart}
        className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 active:bg-primary-700 transition-all touch-manipulation"
        type="button"
      >
        View Cart
      </button>
    </div>
  )
}
