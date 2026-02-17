'use client'

import { useEffect } from 'react'
import type { Order } from '@/types/pos'
import type { CustomerToEdit } from '@/components/POS/AddCustomerModal'

type POSDataLike = {
  isLoading: boolean
  error: string | null
  displayOrders: Order[]
  customers: { id: unknown; phone?: string }[]
}

type ToastFn = (message: string, type: 'success' | 'error' | 'info') => void

export interface UsePOSPageEffectsArgs {
  posData: POSDataLike
  showToast: ToastFn
  setOrdersFromApi: (orders: Order[]) => void
  setNewlyAddedCustomers: React.Dispatch<React.SetStateAction<CustomerToEdit[]>>
  setShowExecutionOrders: (value: boolean | ((prev: boolean) => boolean)) => void
  setMobileActivePanel: (value: 'products' | 'orders' | 'execution' | ((prev: 'products' | 'orders' | 'execution') => 'products' | 'orders' | 'execution')) => void
  mobileActivePanel: 'products' | 'orders' | 'execution'
}

/**
 * Page-level effects for POS: sync orders from API, error toasts, newly-added customer
 * cleanup, viewport/resize behavior, and keyboard shortcuts (R, P).
 */
export function usePOSPageEffects({
  posData,
  showToast,
  setOrdersFromApi,
  setNewlyAddedCustomers,
  setShowExecutionOrders,
  setMobileActivePanel,
  mobileActivePanel,
}: UsePOSPageEffectsArgs): void {
  // Sync display orders from API when POS data has loaded
  useEffect(() => {
    if (!posData.isLoading) {
      setOrdersFromApi(posData.displayOrders)
    }
  }, [posData.isLoading, posData.displayOrders, setOrdersFromApi])

  // Toast when POS data has an error
  useEffect(() => {
    if (posData.error) {
      showToast(posData.error, 'error')
    }
  }, [posData.error, showToast])

  // After refetch, remove from newlyAddedCustomers when API has the same customer (by id or phone)
  useEffect(() => {
    if (posData.customers.length === 0) return
    setNewlyAddedCustomers((prev) =>
      prev.filter((p) => {
        const apiMatch = posData.customers.find(
          (c) => String(c.id) === String(p.id) || (c.phone != null && p.phone && c.phone === p.phone)
        )
        return !apiMatch
      })
    )
  }, [posData.customers, setNewlyAddedCustomers])

  // Handle window resize AND browser zoom – both change effective viewport
  useEffect(() => {
    let rafId: number
    const syncLayoutForViewport = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const width = window.innerWidth
        const isDesktop = width >= 768
        if (isDesktop) {
          setShowExecutionOrders(true)
          setMobileActivePanel('products')
        } else {
          setMobileActivePanel((prev) => prev)
        }
      })
    }
    syncLayoutForViewport()
    window.addEventListener('resize', syncLayoutForViewport)
    window.visualViewport?.addEventListener('resize', syncLayoutForViewport)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', syncLayoutForViewport)
      window.visualViewport?.removeEventListener('resize', syncLayoutForViewport)
    }
  }, [setShowExecutionOrders, setMobileActivePanel])

  // Keyboard shortcuts: R (toggle execution orders), P (scroll to products / focus search)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        if (window.innerWidth < 768) {
          setMobileActivePanel(mobileActivePanel === 'execution' ? 'products' : 'execution')
        } else {
          setShowExecutionOrders((prev) => !prev)
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (window.innerWidth < 768) {
          setMobileActivePanel('products')
        } else {
          const productPanel = document.getElementById('product-catalog-panel')
          if (productPanel) {
            productPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => {
              const searchInput = productPanel.querySelector('input[aria-label="Search products"]') as HTMLInputElement
              if (searchInput) searchInput.focus()
            }, 300)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mobileActivePanel, setMobileActivePanel, setShowExecutionOrders])
}

export default usePOSPageEffects
