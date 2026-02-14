'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { CustomerToEdit } from './AddCustomerModal'

const WAITERS = [
  'Ds Waiter',
  'Waiter 1',
  'Waiter 2',
  'Waiter 3',
]

interface CustomerWaiterInfoProps {
  customer: string
  waiter: string
  onCustomerChange: (customer: string) => void
  onWaiterChange: (waiter: string) => void
  onShowCustomerModal: (customerToEdit?: CustomerToEdit | null) => void
  /** When provided, use these waiter names instead of default list (e.g. from API) */
  waiterOptions?: string[]
  /** When provided, use only these API customers in the dropdown */
  apiCustomers?: CustomerToEdit[]
}

export default function CustomerWaiterInfo({
  customer,
  waiter,
  onCustomerChange,
  onWaiterChange,
  onShowCustomerModal,
  waiterOptions,
  apiCustomers,
}: CustomerWaiterInfoProps) {
  // Use only customers coming from API (no local storage / hardcoded customers)
  const [customers, setCustomers] = useState<CustomerToEdit[]>(() => apiCustomers ?? [])
  const waiterList = waiterOptions && waiterOptions.length > 0 ? waiterOptions : WAITERS
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)
  const customerInputRef = useRef<HTMLInputElement>(null)

  const [waiterSearchQuery, setWaiterSearchQuery] = useState('')
  const [showWaiterDropdown, setShowWaiterDropdown] = useState(false)
  const waiterDropdownRef = useRef<HTMLDivElement>(null)
  const waiterInputRef = useRef<HTMLInputElement>(null)

  /** Cast to record for dynamic key access (first_name, firstName, etc.) without strict type error */
  const asRecord = (o: unknown): Record<string, unknown> => o as Record<string, unknown>
  /** Build full name for dropdown (first + last) – supports last_name, lastName, lastname from API/form */
  const getCustomerFullName = (c: CustomerToEdit) => {
    const first = String(c.name ?? asRecord(c).first_name ?? asRecord(c).firstName ?? '').trim()
    const last = String(c.last_name ?? asRecord(c).lastName ?? asRecord(c).lastname ?? '').trim()
    return [first, last].filter(Boolean).join(' ').trim() || first || '—'
  }

  useEffect(() => {
    setCustomers(apiCustomers ?? [])
  }, [apiCustomers])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (customerDropdownRef.current?.contains(target) || waiterDropdownRef.current?.contains(target)) return
      setShowCustomerDropdown(false)
      setShowWaiterDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const customerOptions = useMemo(() => {
    const list: { label: string; value: string; customer?: CustomerToEdit }[] =
      customers.map((c) => {
        const fullName = getCustomerFullName(c)
        return { label: fullName, value: fullName, customer: c }
      })
    if (!customerSearchQuery.trim()) return list
    const q = customerSearchQuery.toLowerCase()
    return list.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.customer?.phone ?? '').includes(customerSearchQuery)
    )
  }, [customers, customerSearchQuery])

  const filteredWaiters = useMemo(() => {
    if (!waiterSearchQuery.trim()) return waiterList
    const query = waiterSearchQuery.toLowerCase()
    return waiterList.filter((w) => w.toLowerCase().includes(query))
  }, [waiterSearchQuery, waiterList])

  const handleCustomerSelect = (value: string, cust?: CustomerToEdit) => {
    onCustomerChange(value)
    setCustomerSearchQuery('')
    setShowCustomerDropdown(false)
  }

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearchQuery(e.target.value)
    setShowCustomerDropdown(true)
  }

  const handleCustomerInputFocus = () => {
    setShowCustomerDropdown(true)
    if (customer) setCustomerSearchQuery('')
  }

  const selectedCustomer = customers.find(
    (c) => getCustomerFullName(c).toLowerCase() === customer?.toLowerCase()
  )
  const canEditCustomer = Boolean(selectedCustomer)

  const handleWaiterSelect = (selectedWaiter: string) => {
    onWaiterChange(selectedWaiter)
    setWaiterSearchQuery('')
    setShowWaiterDropdown(false)
  }

  const handleWaiterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWaiterSearchQuery(e.target.value)
    setShowWaiterDropdown(true)
  }

  const handleWaiterInputFocus = () => {
    setShowWaiterDropdown(true)
    if (waiter) setWaiterSearchQuery('')
  }

  const ChevronDown = (
    <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className="px-3 py-2 border-b border-neutral-200 bg-white">
      {/* Single row: Waiter (left) | Customer + pencil + add (right) - cart header style */}
      <div className="flex items-center gap-2">
        {/* Waiter dropdown - left */}
        <div className="relative w-full min-w-0 max-w-[140px]" ref={waiterDropdownRef}>
          <input
            ref={waiterInputRef}
            type="text"
            value={showWaiterDropdown ? waiterSearchQuery : (waiter || '')}
            onChange={handleWaiterInputChange}
            onFocus={handleWaiterInputFocus}
            placeholder="Waiter"
            className="w-full pl-2.5 pr-8 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-neutral-800"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            {ChevronDown}
          </span>
          {showWaiterDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredWaiters.length > 0 ? (
                filteredWaiters.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleWaiterSelect(w)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                      waiter === w ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    {w}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-neutral-500 text-center">No waiters found</div>
              )}
            </div>
          )}
        </div>

        {/* Customer dropdown + pencil + dark + button - right */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0 max-w-[180px]" ref={customerDropdownRef}>
            <input
              ref={customerInputRef}
              type="text"
              value={showCustomerDropdown ? customerSearchQuery : (customer || '')}
              onChange={handleCustomerInputChange}
              onFocus={handleCustomerInputFocus}
              placeholder="Customer"
              className="w-full pl-2.5 pr-8 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-neutral-800"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
              {ChevronDown}
            </span>
            {showCustomerDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {customerOptions.length > 0 ? (
                  customerOptions.map((o) => (
                    <button
                      key={o.customer?.id ?? o.value}
                      type="button"
                      onClick={() => handleCustomerSelect(o.value, o.customer)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                        customer === o.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-neutral-500 text-center">No customers found</div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => canEditCustomer && selectedCustomer && onShowCustomerModal(selectedCustomer)}
            disabled={!canEditCustomer}
            className="p-1.5 rounded-lg border border-neutral-300 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Edit customer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onShowCustomerModal()}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white transition-colors shrink-0"
            title="Add customer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
