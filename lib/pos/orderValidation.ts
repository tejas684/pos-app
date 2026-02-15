/**
 * Validates waiter and customer selection for place/update order.
 * Used by POS page to avoid duplicating validation logic.
 */

import { getApiCustomerFullName, type ApiCustomer } from '@/lib/api/pos'
import { getCustomerFullNameForEdit } from '@/lib/pos/customerUtils'
import type { CustomerToEdit } from '@/components/POS/AddCustomerModal'

export interface ValidatedWaiterCustomer {
  waiterId: number
  customerId: number
}

export interface POSDataLike {
  waiters: { id: string | number; name?: string }[]
  customers: { id: string | number; name?: string; last_name?: string; phone?: string; email?: string }[]
}

export function validateWaiterAndCustomer(
  posData: POSDataLike,
  newlyAddedCustomers: CustomerToEdit[],
  waiter: string,
  customer: string,
  showToast: (message: string, type: 'error' | 'success' | 'info') => void
): ValidatedWaiterCustomer | null {
  const waiterMatch = posData.waiters.find((w) => (w.name ?? String(w.id)) === waiter)
  const selectedName = customer.trim()
  const apiMatch = posData.customers.find(
    (c) => getApiCustomerFullName({ ...c, id: String(c.id) } as ApiCustomer).toLowerCase() === selectedName.toLowerCase()
  )
  const newMatch = newlyAddedCustomers.find(
    (c) => getCustomerFullNameForEdit(c).toLowerCase() === selectedName.toLowerCase()
  )
  const customerMatch = apiMatch ?? newMatch ?? null

  if (!waiterMatch || waiterMatch.id == null) {
    showToast('Please select a waiter from the list.', 'error')
    return null
  }
  if (
    !selectedName ||
    selectedName.toLowerCase() === 'walk-in customer' ||
    !customerMatch ||
    customerMatch.id == null
  ) {
    showToast('Please select a customer from the list.', 'error')
    return null
  }

  return {
    waiterId: Number(waiterMatch.id),
    customerId: Number(customerMatch.id),
  }
}
