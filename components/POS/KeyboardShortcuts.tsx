'use client'

import { memo } from 'react'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null

  const shortcuts = [
    { key: 'S', description: 'Show Quick Stats' },
    { key: 'R', description: 'Toggle Running Orders' },
    { key: 'T', description: 'Order Type' },
    { key: 'C', description: 'Select Customer' },
    { key: 'W', description: 'Select Waiter' },
    { key: 'E', description: 'Edit Order' },
    { key: 'N', description: 'Add Note' },
    { key: '/', description: 'Focus Search' },
    { key: 'Enter', description: 'Place Order' },
    { key: 'Esc', description: 'Clear Cart' },
    { key: 'Ctrl+D', description: 'Save Draft' },
    { key: 'Ctrl+I', description: 'Quick Invoice' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-strong w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:border-primary-300 transition-all"
              >
                <span className="text-sm font-semibold text-gray-700">{shortcut.description}</span>
                <kbd className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-sm text-primary-700">
              <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white border border-primary-300 rounded text-xs font-bold">?</kbd> to toggle this help menu
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(KeyboardShortcuts)
