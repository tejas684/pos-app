/**
 * ============================================================================
 * POS HEADER COMPONENT (components/POS/POSHeader.tsx)
 * ============================================================================
 * 
 * This component renders the top navigation bar of the POS system.
 * 
 * Features:
 * 1. Quick Stats Toggle - Shows/hides statistics panel (Active Orders, Revenue, etc.)
 * 2. Customer Info Button - Opens customer selection modal
 * 5. Real-time Clock - Displays current time
 * 
 * Design:
 * - Fixed at top of screen
 * - Glassmorphism effect (backdrop blur, semi-transparent)
 * - Responsive button layout
 * - Hover effects and transitions
 * 
 * Props Pattern:
 * - Receives all data and callbacks via props (presentational component)
 * - No direct state management (state managed in parent via usePOS hook)
 */

'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { OrderType } from '@/types/pos'

/**
 * QuickStats Interface
 * 
 * Statistics displayed in the quick stats panel:
 * - activeOrders: Number of orders currently in progress
 * - todayRevenue: Total revenue for today
 * - todayOrders: Total number of orders placed today
 * - cartItems: Number of items in current cart
 */
interface QuickStats {
  activeOrders: number
  todayRevenue: number
  todayOrders: number
  cartItems: number
}

/**
 * POSHeaderProps Interface
 * 
 * Props passed from parent component (POSPage):
 * - quickStats: Statistics data to display
 * - currentTime: Current date/time for clock display
 * - showQuickStats: Whether stats panel is visible
 * - showExecutionOrders: Whether execution orders sidebar is visible
 * - onToggleQuickStats: Callback to toggle stats panel
 * - onToggleExecutionOrders: Callback to toggle execution orders sidebar
 * - onShowCustomerModal: Callback to show customer selection modal
 */
interface POSHeaderProps {
  quickStats: QuickStats
  currentTime: Date | null
  showQuickStats: boolean
  showExecutionOrders: boolean
  onToggleQuickStats: () => void
  onToggleExecutionOrders: () => void
  onShowCustomerModal: () => void
}

export default function POSHeader({
  quickStats,
  currentTime,
  showQuickStats,
  showExecutionOrders,
  onToggleQuickStats,
  onToggleExecutionOrders,
  onShowCustomerModal,
}: POSHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-soft flex-wrap md:flex-nowrap overflow-x-auto scrollbar-hide min-h-[44px]">
      {/* Time Display */}
      <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-neutral-50 rounded-lg border border-neutral-200 shadow-soft shrink-0">
        {currentTime ? (
          <>
            <div className="text-[10px] font-semibold text-neutral-500">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div className="text-[11px] sm:text-xs font-bold text-neutral-800">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </>
        ) : (
          <>
            <div className="text-[10px] sm:text-xs font-semibold text-neutral-500">--</div>
            <div className="text-xs sm:text-sm font-bold text-neutral-800">--:--:--</div>
          </>
        )}
      </div>

      <button
        onClick={onToggleExecutionOrders}
        className={`px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1 relative text-xs min-h-[34px] sm:min-h-0 touch-manipulation shrink-0 ${
          showExecutionOrders
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-glow'
            : 'bg-neutral-400 text-white hover:bg-neutral-500'
        }`}
        title="Execution Orders (R)"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="hidden sm:inline">Execution Orders</span>
        {quickStats.activeOrders > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {quickStats.activeOrders}
          </span>
        )}
      </button>
      <button
        onClick={onShowCustomerModal}
        className="hidden sm:flex px-3 py-1.5 bg-gradient-primary text-white rounded-lg font-semibold hover:shadow-glow transition-all shadow-sm active:scale-95 items-center gap-1.5 text-xs"
        title="Select Customer (C)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden md:inline">Customer</span>
      </button>
      <div className="flex-1"></div>
      <button
        onClick={handleLogout}
        className="px-2 sm:px-2.5 py-1.5 bg-neutral-600 text-white rounded-lg font-semibold hover:bg-neutral-700 active:bg-neutral-800 transition-all shadow-sm border border-neutral-500 shrink-0 min-h-[34px] sm:min-h-0 text-xs"
        title="Logout"
      >
        <span className="hidden sm:inline">{user?.name || user?.email || 'Logout'}</span>
        <svg className="w-4 h-4 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </header>
  )
}
