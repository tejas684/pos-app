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
  const area = order.area ?? '—'
  const tableNum = order.tableName ?? '—'
  const customer = esc(order.customer || '—')
  return `
    <h1 class="invoice-title">INVOICE</h1>
    <p class="order-line">Order : ${esc(orderNumber)}</p>
    <p class="order-line">Area : ${esc(area)}</p>
    <p class="order-line">Table Number : ${esc(tableNum)}</p>
    <hr class="dashed" />
    <p class="info-line">Date: ${orderDate}</p>
    <p class="info-line">Customer: ${customer}</p>
    <hr class="dashed" />
    <table class="items-table">
      <thead>
        <tr><th class="cell">Item</th><th class="cell center">Qty</th><th class="cell right">Price</th><th class="cell right">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <hr class="dashed" />
    <p class="subtotal-row"><span>Subtotal:</span><span class="amt">${currency}${subtotal.toFixed(2)}</span></p>
    <hr class="dashed" />
    <p class="summary-row"><span>Selected Person:</span><span class="amt">${selectedPersons}</span></p>
    <p class="summary-row"><span>Total Charge:</span><span class="amt">${currency}${charge.toFixed(2)}</span></p>
    <p class="grand-total-row"><span>GRAND TOTAL:</span><span class="amt">${currency}${order.total.toFixed(2)}</span></p>
    <hr class="dashed" />
    <p class="footer-msg">Thank you! Visit Again</p>
  `
}

const PRINT_STYLES = `
  @page { size: auto; margin: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; padding: 24px; color: #111; max-width: 400px; margin: 0 auto; line-height: 1.5; }
  .invoice-title { text-align: center; font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
  .order-line { margin: 2px 0; font-size: 14px; }
  .info-line { margin: 2px 0; font-size: 14px; }
  .dashed { border: none; border-top: 1px dashed #999; margin: 10px 0; }
  .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px; }
  .items-table th, .items-table td { padding: 6px 8px; text-align: left; }
  .items-table thead th { font-weight: bold; }
  .cell { padding: 6px 8px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .subtotal-row, .summary-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 14px; }
  .subtotal-row .amt, .summary-row .amt { text-align: right; }
  .grand-total-row { display: flex; justify-content: space-between; margin: 8px 0 0 0; font-size: 14px; font-weight: bold; }
  .grand-total-row .amt { text-align: right; font-weight: bold; }
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
        <title> </title>
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
