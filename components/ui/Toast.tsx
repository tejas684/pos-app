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
 * 4. Single toast: New toast replaces the previous one so the latest action is always shown
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
 * - toasts: Array of active toasts (for rendering in header or custom slot)
 * - removeToast: Remove a toast by id
 */
export interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  toasts: Toast[]
  removeToast: (id: string) => void
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
   * @param duration - Auto-dismiss time in ms (default: 2500ms, 0 = no auto-dismiss)
   */
  const showToast = (message: string, type: ToastType = 'info', duration = 2500) => {
    // Generate unique ID for the toast
    const id = Math.random().toString(36).substring(7)

    // Replace previous toasts so the latest notification shows immediately when clicking another button
    setToasts([{ id, message, type, duration }])

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

  const toastStyles: Record<ToastType, string> = {
    success:
      'bg-white border border-success-200 shadow-medium text-success-800 [--toast-accent:theme(colors.success.500)]',
    error:
      'bg-white border border-danger-200 shadow-medium text-danger-800 [--toast-accent:theme(colors.danger.500)]',
    warning:
      'bg-white border border-warning-200 shadow-medium text-warning-800 [--toast-accent:theme(colors.warning.500)]',
    info:
      'bg-white border border-primary-200 shadow-medium text-primary-800 [--toast-accent:theme(colors.primary.500)]',
  }

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * Renders the list of toasts. Use inside a component that has access to useToast (e.g. POSHeader).
 * Pass compact=true for header-inline styling.
 */
const toastStylesMap: Record<ToastType, string> = {
  success:
    'bg-white border border-success-200 shadow-medium text-success-800 [--toast-accent:theme(colors.success.500)]',
  error:
    'bg-white border border-danger-200 shadow-medium text-danger-800 [--toast-accent:theme(colors.danger.500)]',
  warning:
    'bg-white border border-warning-200 shadow-medium text-warning-800 [--toast-accent:theme(colors.warning.500)]',
  info:
    'bg-white border border-primary-200 shadow-medium text-primary-800 [--toast-accent:theme(colors.primary.500)]',
}

export function ToastList({ compact = false }: { compact?: boolean }) {
  const { toasts, removeToast } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className={compact ? 'flex flex-wrap items-center gap-1.5' : 'flex flex-col gap-3'}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-2 rounded-xl border-l-4 animate-slide-in-right ${toastStylesMap[toast.type]} ${compact ? 'min-w-0 max-w-[220px] sm:max-w-[260px] pl-2 pr-1.5 py-1.5' : 'min-w-[300px] max-w-md pl-4 pr-3 py-3'}`}
          style={{ borderLeftColor: 'var(--toast-accent)' }}
        >
          <p className={compact ? 'flex-1 text-xs font-medium truncate' : 'flex-1 text-sm font-medium'}>
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 transition-colors shrink-0"
            aria-label="Close toast"
          >
            <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
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
