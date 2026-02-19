'use client'

import { useMemo } from 'react'
import type { Order } from '@/types/pos'
import { usePOSData } from '@/contexts/POSDataContext'
import { useToast } from '@/components/ui/Toast'
import { getApiCustomerFullName } from '@/lib/api/pos'

/** Normalize phone for WhatsApp: digits only; if 10 digits, prepend 91 (India). */
function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && !digits.startsWith('0')) {
    return '91' + digits
  }
  return digits
}

/** Get phone from customer – check all common API fields. */
function getCustomerPhone(c: Record<string, unknown>): string | null {
  const raw =
    c.phone ?? c.mobile ?? c.contact ?? c.contact_number ?? c.phone_number
  if (raw == null || typeof raw !== 'string') return null
  const s = raw.trim()
  return s.length >= 6 ? s : null
}

export interface SendInvoiceWhatsAppButtonProps {
  /** Order for which to send the invoice. Customer phone is resolved from order.customerId or customer name. */
  order: Order
  /** Optional base URL for the invoice link (defaults to window.location.origin in browser). */
  invoiceBaseUrl?: string
  className?: string
  disabled?: boolean
}

/**
 * Button that opens WhatsApp with the order's customer phone and a pre-filled message
 * containing a link to the invoice page so the customer can open and download as PDF.
 */
export function SendInvoiceWhatsAppButton({
  order,
  invoiceBaseUrl,
  className = '',
  disabled = false,
}: SendInvoiceWhatsAppButtonProps) {
  const { customers } = usePOSData()
  const { showToast } = useToast()

  const { waUrl, hasPhone } = useMemo(() => {
    const base =
      typeof window !== 'undefined' ? window.location.origin : (invoiceBaseUrl?.replace(/\/$/, '') ?? '')
    const invoiceLink = `${base}/invoice/${order.id}`
    let phoneRaw: string | null = null

    // Prefer customer number from the order (set when order is loaded from API / display orders)
    if (order.customerPhone?.trim() && order.customerPhone.trim().length >= 6) {
      phoneRaw = order.customerPhone.trim()
    }

    if (!phoneRaw && customers.length > 0) {
      const byId =
        order.customerId != null
          ? customers.find((x) => String(x.id) === String(order.customerId))
          : null
      if (byId) phoneRaw = getCustomerPhone(byId as unknown as Record<string, unknown>)
      if (!phoneRaw && order.customer?.trim()) {
        const nameLower = order.customer.trim().toLowerCase()
        const byName = customers.find((c) => {
          const full = getApiCustomerFullName(c).trim().toLowerCase()
          return full === nameLower || full.includes(nameLower) || nameLower.includes(full)
        })
        if (byName) phoneRaw = getCustomerPhone(byName as unknown as Record<string, unknown>)
      }
    }

    const normalized =
      phoneRaw != null ? normalizePhoneForWhatsApp(phoneRaw) : null
    const hasValidPhone =
      normalized != null && normalized.replace(/\D/g, '').length >= 6

    const orderNumber = order.orderNumber ?? order.id
    const message = `Your invoice for Order #${orderNumber}:\n\n${invoiceLink}\n\nOpen the link and use Print → Save as PDF to download the invoice.`
    const encoded = encodeURIComponent(message)
    const waUrl =
      hasValidPhone && normalized
        ? `https://wa.me/${normalized}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`

    return { waUrl, hasPhone: hasValidPhone }
  }, [order.id, order.orderNumber, order.customerId, order.customer, order.customerPhone, customers, invoiceBaseUrl])

  const handleClick = () => {
    if (!hasPhone) {
      showToast('Customer phone not found. Add phone in customer details, or send the link manually.', 'error')
    }
  }

  const content = (
    <span className="flex items-center justify-center gap-1.5 text-sm text-inherit">
      <svg className="w-4 h-4 shrink-0 text-inherit" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Send Invoice on WhatsApp
    </span>
  )

  const title =
    hasPhone
      ? 'Send invoice link to customer on WhatsApp'
      : 'Send invoice link (no customer phone – you can choose contact in WhatsApp)'

  if (disabled) {
    return (
      <span
        title={title}
        className={`inline-flex items-center justify-center opacity-50 cursor-not-allowed ${className}`}
        aria-disabled
      >
        {content}
      </span>
    )
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={title}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {content}
    </a>
  )
}
