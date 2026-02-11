/**
 * ============================================================================
 * TOAST NOTIFICATION SYSTEM (components/ui/Toast.tsx)
 * ============================================================================
 * 
 * This component provides a toast notification system for the entire application.
 * 
 * Architecture:
 * - Uses React Context API for global state management
 * - ToastProvider wraps the app in layout.tsx
 * - useToast hook provides easy access to showToast function
 * 
 * Features:
 * 1. Multiple Toast Types: success, error, warning, info
 * 2. Auto-dismiss: Toasts automatically disappear after duration
 * 3. Manual Dismiss: Users can close toasts manually
 * 4. Stacking: Multiple toasts can be displayed simultaneously
 * 5. Animations: Slide-in animations for better UX
 * 
 * Usage Example:
 * ```tsx
 * const { showToast } = useToast()
 * showToast('Order placed successfully!', 'success')
 * ```
 * 
 * Toast Types:
 * - success: Green background (positive actions)
 * - error: Red background (errors, failures)
 * - warning: Yellow background (warnings, cautions)
 * - info: Blue background (informational messages)
 */

'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

/**
 * ToastType
 * 
 * Defines the four types of toast notifications:
 * - success: For successful operations (green)
 * - error: For errors and failures (red)
 * - warning: For warnings and cautions (yellow)
 * - info: For informational messages (blue)
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast Interface
 * 
 * Represents a single toast notification:
 * - id: Unique identifier for the toast
 * - message: Text to display in the toast
 * - type: Visual style of the toast
 * - duration: Auto-dismiss time in milliseconds (0 = no auto-dismiss)
 */
export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

/**
 * ToastContextType Interface
 * 
 * Defines the context value provided by ToastProvider:
 * - showToast: Function to display a new toast notification
 */
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

/**
 * ToastContext
 * 
 * React Context for toast notifications.
 * Used to share toast state and functions across the entire app.
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * ToastProvider Component
 * 
 * Provides toast notification functionality to all child components.
 * 
 * Responsibilities:
 * 1. Manages array of active toasts
 * 2. Provides showToast function via context
 * 3. Renders toast notifications in fixed position
 * 4. Handles auto-dismiss timers
 * 
 * @param children - Child components that can use toast notifications
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  // State: Array of currently displayed toasts
  const [toasts, setToasts] = useState<Toast[]>([])

  /**
   * showToast Function
   * 
   * Creates and displays a new toast notification.
   * 
   * @param message - Text to display in the toast
   * @param type - Toast type (default: 'info')
   * @param duration - Auto-dismiss time in ms (default: 3000ms, 0 = no auto-dismiss)
   */
  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    // Generate unique ID for the toast
    const id = Math.random().toString(36).substring(7)
    
    // Add new toast to the array
    setToasts((prev) => [...prev, { id, message, type, duration }])

    // Set up auto-dismiss timer if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    }
  }

  /**
   * removeToast Function
   * 
   * Removes a toast from the display (manual dismiss).
   * 
   * @param id - ID of the toast to remove
   */
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-right ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close toast"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * useToast Hook
 * 
 * Custom hook to access toast functionality from any component.
 * 
 * Usage:
 * ```tsx
 * const { showToast } = useToast()
 * showToast('Success message', 'success')
 * ```
 * 
 * @returns ToastContext value with showToast function
 * @throws Error if used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext)
  
  // Safety check: Ensure hook is used within ToastProvider
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  
  return context
}
