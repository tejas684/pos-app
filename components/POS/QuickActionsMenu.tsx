'use client'

interface QuickActionsMenuProps {
  isOpen: boolean
  onToggle: () => void
  onShowDiscountModal: () => void
  onShowPaymentModal: () => void
  onShowTableModal: () => void
  onClearCart: () => void
}

export default function QuickActionsMenu({
  isOpen,
  onToggle,
  onShowDiscountModal,
  onShowPaymentModal,
  onShowTableModal,
  onClearCart,
}: QuickActionsMenuProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-xl shadow-strong border border-gray-200 p-2 min-w-[200px]">
          <button
            onClick={() => {
              onShowDiscountModal()
              onToggle()
            }}
            className="w-full px-4 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Apply Discount
          </button>
          <button
            onClick={() => {
              onShowPaymentModal()
              onToggle()
            }}
            className="w-full px-4 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Process Payment
          </button>
          <button
            onClick={() => {
              onShowTableModal()
              onToggle()
            }}
            className="w-full px-4 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Select Table
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => {
              onClearCart()
              onToggle()
            }}
            className="w-full px-4 py-2.5 text-left rounded-lg hover:bg-danger-50 transition-all flex items-center gap-2 text-sm font-semibold text-danger-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cart
          </button>
        </div>
      )}
      <button
        onClick={onToggle}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform ${
          isOpen
            ? 'bg-gradient-to-r from-primary-600 to-primary-700 rotate-45'
            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
        } text-white hover:scale-110 active:scale-95`}
        title="Quick Actions"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
