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

  /** Reset search state when customer/waiter are cleared externally (e.g. Cancel button) */
  useEffect(() => {
    if (!customer) {
      setCustomerSearchQuery('')
      setShowCustomerDropdown(false)
    }
    if (!waiter) {
      setWaiterSearchQuery('')
      setShowWaiterDropdown(false)
    }
  }, [customer, waiter])

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
    <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className="px-2 py-1.5 border-b border-primary-100 bg-white/90 text-xs">
      {/* Row aligned with table columns: 26% 14% 22% 14% 14% 10% (Item, Price, Qty, Discount, Total, action) */}
      <div className="grid grid-cols-[26%_14%_22%_14%_14%_10%] min-w-[360px] w-full items-center gap-x-3">
        {/* Waiter - column 1 (aligns with Item) */}
        <div className="relative min-w-0" ref={waiterDropdownRef}>
          <input
            ref={waiterInputRef}
            type="text"
            value={showWaiterDropdown ? waiterSearchQuery : (waiter || '')}
            onChange={handleWaiterInputChange}
            onFocus={handleWaiterInputFocus}
            placeholder="Waiter"
            className="w-full pl-2 pr-6 py-1 border border-primary-200/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white text-neutral-800 placeholder:text-neutral-400"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            {ChevronDown}
          </span>
          {showWaiterDropdown && (
            <div className="absolute z-50 w-full mt-0.5 bg-white border border-primary-200 rounded-lg shadow-medium max-h-52 overflow-y-auto">
              {filteredWaiters.length > 0 ? (
                filteredWaiters.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleWaiterSelect(w)}
                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-50 transition-colors ${
                      waiter === w ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    {w}
                  </button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-neutral-500 text-center">No waiters found</div>
              )}
            </div>
          )}
        </div>

        {/* Customer - columns 2 & 3 (aligns with Price, Qty) */}
        <div className="col-span-2 relative min-w-0" ref={customerDropdownRef}>
          <input
            ref={customerInputRef}
            type="text"
            value={showCustomerDropdown ? customerSearchQuery : (customer || '')}
            onChange={handleCustomerInputChange}
            onFocus={handleCustomerInputFocus}
            placeholder="Customer"
            className="w-full pl-2 pr-6 py-1 border border-primary-200/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white text-neutral-800 placeholder:text-neutral-400"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            {ChevronDown}
          </span>
          {showCustomerDropdown && (
            <div className="absolute z-50 w-full mt-0.5 bg-white border border-primary-200 rounded-lg shadow-medium max-h-52 overflow-y-auto left-0 min-w-[140px]">
              {customerOptions.length > 0 ? (
                customerOptions.map((o) => (
                  <button
                    key={o.customer?.id ?? o.value}
                    type="button"
                    onClick={() => handleCustomerSelect(o.value, o.customer)}
                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-50 transition-colors ${
                      customer === o.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-neutral-500 text-center">No customers found</div>
              )}
            </div>
          )}
        </div>

        {/* Columns 4 & 5 - Edit and Add buttons (grouped, no gap between) */}
        <div className="col-span-2 flex items-center justify-end gap-1 min-w-0">
          <button
            type="button"
            onClick={() => canEditCustomer && selectedCustomer && onShowCustomerModal(selectedCustomer)}
            disabled={!canEditCustomer}
            className="p-1 rounded-lg border border-primary-200/80 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Edit customer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onShowCustomerModal()}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-600 text-white shadow-sm transition-colors shrink-0"
            title="Add customer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Column 6 (action) - empty for alignment */}
        <div className="min-w-0" />
      </div>
    </div>
  )
}
