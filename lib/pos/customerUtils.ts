/**
 * Customer display name utilities for POS.
 * Used for matching and displaying customer names (supports single name or name + last_name).
 */

/** Accept any object with optional name / last_name (e.g. CustomerToEdit, API customer) */
type CustomerNameLike = { name?: string; last_name?: string }

/** Full name for CustomerToEdit (newly added / modal) – used for matching and display */
export function getCustomerFullNameForEdit(c: CustomerNameLike = {}): string {
  const o = c as CustomerNameLike & Record<string, unknown>
  const first = String(c.name ?? '').trim()
  const last = String(c.last_name ?? o?.lastName ?? o?.lastname ?? '').trim()
  return [first, last].filter(Boolean).join(' ').trim() || first
}
