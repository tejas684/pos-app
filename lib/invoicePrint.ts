/**
 * Shared invoice print format: header, dotted lines, Subtotal, Selected Person, Total Charge, GRAND TOTAL, thank you.
 * Used by PaymentModal (Print Invoice) and InvoiceBillModal (Print).
 */
import type { Order, CartItem } from '@/types/pos'

const DEFAULT_CURRENCY = '₹'

function getItemLineTotals(item: CartItem) {
  const unitPrice = item.price + (item.modifiers?.reduce((s, m) => s + m.price, 0) || 0)
  const lineTotal = unitPrice * item.quantity
  const isPercentage = item.discountType === 'percentage'
  const rawDiscount = item.discount ?? 0
  const itemDiscount =
    rawDiscount <= 0
      ? 0
      : isPercentage
        ? (lineTotal * Math.min(100, rawDiscount)) / 100
        : Math.min(rawDiscount * item.quantity, lineTotal)
  const totalAfterDiscount = Math.max(0, lineTotal - itemDiscount)
  return { unitPrice, totalAfterDiscount }
}

function formatOrderDateForInvoice(date: Date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${h}:${min}`
}

function formatPrintTimestamp(date: Date) {
  const d = new Date(date)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const y = String(d.getFullYear()).slice(-2)
  const h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${m}/${day}/${y}, ${h12}:${min} ${ampm}`
}

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildInvoicePrintHtml(order: Order, currency: string = DEFAULT_CURRENCY): string {
  const orderNumber = order.orderNumber ?? order.id
  const selectedPersons = order.selectedPersons ?? 0
  const pricePerPerson = order.pricePerPerson ?? 0
  const charge = order.charge ?? (selectedPersons > 0 && pricePerPerson > 0 ? selectedPersons * pricePerPerson : 0)
  const items = order.items ?? []
  let subtotal = 0
  const rows = items
    .map((item) => {
      const { unitPrice, totalAfterDiscount } = getItemLineTotals(item)
      subtotal += totalAfterDiscount
      const name = esc(item.name)
      return `<tr><td class="cell">${name}</td><td class="cell center">${item.quantity}</td><td class="cell right">${currency}${unitPrice.toFixed(2)}</td><td class="cell right">${currency}${totalAfterDiscount.toFixed(2)}</td></tr>`
    })
    .join('')
  const orderDate = formatOrderDateForInvoice(order.createdAt)
  const printTime = formatPrintTimestamp(new Date())
  const area = order.area ?? '—'
  const tableNum = order.tableName ?? '—'
  const customer = esc(order.customer || '—')
  return `
    <p class="top-date">${printTime}</p>
    <h1 class="invoice-title">INVOICE</h1>
    <p class="order-line">Order : ${esc(orderNumber)}</p>
    <p class="order-line">Area : ${esc(area)}</p>
    <p class="order-line">Table Number : ${esc(tableNum)}</p>
    <hr class="dotted" />
    <p class="info-line">Date: ${orderDate}</p>
    <p class="info-line">Customer: ${customer}</p>
    <hr class="dotted" />
    <table class="items-table">
      <thead>
        <tr><th class="cell">Item</th><th class="cell center">Qty</th><th class="cell right">Price</th><th class="cell right">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="subtotal-line">Subtotal: ${currency}${subtotal.toFixed(2)}</p>
    <hr class="dotted" />
    <p class="charge-line">Selected Person: ${selectedPersons}</p>
    <p class="charge-line">Total Charge: ${currency}${charge.toFixed(2)}</p>
    <p class="grand-total">GRAND TOTAL: ${currency}${order.total.toFixed(2)}</p>
    <hr class="dotted" />
    <p class="footer-msg">Thank you! Visit Again</p>
  `
}

const PRINT_STYLES = `
  body { font-family: system-ui, sans-serif; font-size: 14px; padding: 24px; color: #111; max-width: 400px; margin: 0 auto; }
  .top-date { margin: 0 0 12px 0; font-size: 13px; color: #444; }
  .invoice-title { text-align: center; font-size: 22px; font-weight: bold; margin: 0 0 8px 0; }
  .order-line { margin: 2px 0; font-size: 14px; }
  .info-line { margin: 2px 0; font-size: 14px; }
  .dotted { border: none; border-top: 1px dotted #999; margin: 10px 0; }
  .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
  .items-table th, .items-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; }
  .cell { padding: 6px 8px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .subtotal-line { text-align: right; margin: 8px 0 0 0; font-size: 14px; }
  .charge-line { margin: 2px 0; font-size: 14px; }
  .grand-total { font-weight: bold; font-size: 15px; margin: 6px 0 0 0; }
  .footer-msg { text-align: center; margin: 14px 0 0 0; font-size: 14px; }
`

/** Open print dialog with invoice for the given order. Returns a Promise that resolves when the user dismisses the print dialog. */
export function printInvoice(order: Order, currency: string = DEFAULT_CURRENCY): Promise<void> {
  return new Promise((resolve) => {
    const orderNumber = order.orderNumber ?? order.id
    const content = buildInvoicePrintHtml(order, currency)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      window.print()
      resolve()
      return
    }
    const onPrintDone = () => {
      printWindow.removeEventListener('afterprint', onPrintDone)
      printWindow.close()
      resolve()
    }
    printWindow.addEventListener('afterprint', onPrintDone)
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${orderNumber}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>${content}</body>
    </html>
  `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  })
}
