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

const WALK_IN_NAME_VARIANTS = ['walk-in customer', 'walk-in', 'walk in', 'walkin customer', 'walkin']

/** Find the Walk-in customer in the API list (by name variants). Returns the customer and its display name, or null. */
export function findWalkInCustomerFromApi(
  customers: POSDataLike['customers']
): { customer: ApiCustomer & { id: string | number }; displayName: string } | null {
  if (!customers?.length) return null
  const walkIn = customers.find((c) => {
    const full = getApiCustomerFullName({ ...c, id: String(c.id) } as ApiCustomer).toLowerCase().trim()
    return WALK_IN_NAME_VARIANTS.some((v) => full === v || full.replace(/\s+/g, ' ').includes(v))
  })
  if (!walkIn?.id) return null
  const displayName = getApiCustomerFullName({ ...walkIn, id: String(walkIn.id) } as ApiCustomer)
  return { customer: walkIn as ApiCustomer & { id: string | number }, displayName }
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
  const selectedLower = selectedName.toLowerCase()
  const isWalkIn = WALK_IN_NAME_VARIANTS.some((v) => selectedLower === v || selectedLower.replace(/\s+/g, ' ').includes(v))
  const apiMatch = posData.customers.find(
    (c) => getApiCustomerFullName({ ...c, id: String(c.id) } as ApiCustomer).toLowerCase() === selectedName.toLowerCase()
  )
  const newMatch = newlyAddedCustomers.find(
    (c) => getCustomerFullNameForEdit(c).toLowerCase() === selectedName.toLowerCase()
  )
  let customerMatch = apiMatch ?? newMatch ?? null

  // Prefer Walk-in customer from API (by name variants) when user selected Walk-in
  if (isWalkIn && !customerMatch && posData.customers.length > 0) {
    const walkInResult = findWalkInCustomerFromApi(posData.customers)
    if (walkInResult) customerMatch = walkInResult.customer
  }
  if (isWalkIn && !customerMatch && posData.customers.length > 0) {
    const first = posData.customers[0]
    if (first?.id != null) customerMatch = first as ApiCustomer & { id: string | number }
  }

  if (!waiterMatch || waiterMatch.id == null) {
    showToast('Please select a waiter from the list.', 'error')
    return null
  }
  if (!selectedName || !customerMatch || customerMatch.id == null) {
    showToast('Please select a customer from the list.', 'error')
    return null
  }

  return {
    waiterId: Number(waiterMatch.id),
    customerId: Number(customerMatch.id),
  }
}
