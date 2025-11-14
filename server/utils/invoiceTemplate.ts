import type { Invoice } from '../api/invoices/index.get'

export interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
  website?: string
  bankDetails?: string
  taxId?: string
  footerNote?: string
}

function formatCurrency(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(value ?? 0)
  } catch {
    return `$${Number(value ?? 0).toFixed(2)}`
  }
}

export function generateInvoiceHtml(invoice: Invoice, company: CompanyInfo = { name: 'Zargar Invoice' }) {
  const logoSection = company.logoUrl
    ? `<div class="logo"><img src="${company.logoUrl}" alt="${company.name}" style="max-height: 80px;"></div>`
    : ''

  const companyDetails = `
    <div class="company-info">
      ${logoSection}
      <div>
        <h3>${company.name}</h3>
        ${company.address ? `<p>${company.address}</p>` : ''}
        ${company.phone ? `<p>${company.phone}</p>` : ''}
        ${company.email ? `<p>${company.email}</p>` : ''}
        ${company.website ? `<p>${company.website}</p>` : ''}
        ${company.bankDetails ? `<p><strong>Bank Details:</strong><br>${company.bankDetails.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    </div>
  `

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; color: #1f2937; }
    body { font-family: Arial, sans-serif; padding: 40px 48px; }
    .container { width: 100%; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .company-info { display: flex; align-items: center; gap: 20px; }
    .logo img { max-height: 80px; }
    h1 { margin: 0; font-size: 28px; }
    h3 { margin: 0 0 10px 0; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
    .totals table { width: 320px; }
    .totals td { border: none; }
    .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #e2e8f0; }
    .status { display: inline-flex; padding: 6px 14px; border-radius: 9999px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .status-draft { background: #e2e8f0; color: #475569; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p><strong>Date:</strong> ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
        ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
        <p><strong>Status:</strong> <span class="status status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
      </div>
      ${companyDetails}
    </div>

    <div class="invoice-info">
      <div>
        <h3>Bill To</h3>
        <p><strong>${invoice.customerName}</strong></p>
        <p>${invoice.customerEmail}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Size / Origin</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
        <tr>
          <td>
            <div style="font-weight:600;color:#0f172a;">${item.productName}</div>
          </td>
          <td>
            <div>${item.productId ? `Serial: ${item.productId}` : '-'}</div>
            <div style="color:#94a3b8;font-size:12px;">
              ${item.length ? `${item.length}cm` : ''}${item.width ? ` × ${item.width}cm` : ''}${item.origin ? ` • ${item.origin}` : ''}
            </div>
          </td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price, invoice.currency)}</td>
          <td>${formatCurrency(item.total, invoice.currency)}</td>
        </tr>
      `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td style="text-align:right;">Subtotal:</td>
          <td style="text-align:right;">${formatCurrency(invoice.subtotal, invoice.currency)}</td>
        </tr>
        <tr>
          <td style="text-align:right;">Tax:</td>
          <td style="text-align:right;">${formatCurrency(invoice.tax, invoice.currency)}</td>
        </tr>
        <tr class="total-row">
          <td style="text-align:right;">Total:</td>
          <td style="text-align:right;">${formatCurrency(invoice.total, invoice.currency)}</td>
        </tr>
      </table>
    </div>

    ${invoice.memo ? `<div style="margin-top:32px;"><h3>Memo</h3><p>${invoice.memo}</p></div>` : ''}

    <div class="footer">
      <p>${company.footerNote || `Thank you for choosing ${company.name}. If you have any questions about this invoice, please contact us.`}</p>
      ${invoice.terms ? `<p style="margin-top:12px;color:#475569;"><strong>Terms:</strong> ${invoice.terms}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `
}

export function generateInvoiceText(invoice: Invoice, company: CompanyInfo = { name: 'Zargar Invoice' }) {
  const items = invoice.items
    .map((item) => {
      const size = [item.productId ? `Serial: ${item.productId}` : '', item.length ? `${item.length}cm` : '', item.width ? `${item.width}cm` : '', item.origin]
        .filter(Boolean)
        .join(' / ')

      return `${item.productName}
  Size/Origin: ${size || 'N/A'}
  Quantity: ${item.quantity}
  Price: ${formatCurrency(item.price, invoice.currency)}
  Line Total: ${formatCurrency(item.total, invoice.currency)}`
    })
    .join('\n\n')

  return `
Invoice ${invoice.invoiceNumber}
Status: ${invoice.status.toUpperCase()}
Date: ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
${invoice.dueDate ? `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n` : ''}

Bill To:
${invoice.customerName}
${invoice.customerEmail}

${company.address ? `Company Address:\n${company.address}\n\n` : ''}
${company.phone ? `Phone: ${company.phone}\n` : ''}
${company.email ? `Email: ${company.email}\n` : ''}
${company.bankDetails ? `\nBank Details:\n${company.bankDetails}\n` : ''}

Items:
${items}

Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}
Tax: ${formatCurrency(invoice.tax, invoice.currency)}
Total: ${formatCurrency(invoice.total, invoice.currency)}

${invoice.memo ? `Memo:\n${invoice.memo}\n` : ''}

${invoice.terms ? `Terms:\n${invoice.terms}\n` : ''}

${company.footerNote || `Thank you,\n${company.name}`}
  `
}


