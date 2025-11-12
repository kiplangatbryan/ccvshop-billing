import PdfPrinter from 'pdfmake'
import type { Invoice } from '../api/invoices/index.get'
import type { CompanyInfo } from './invoiceTemplate'

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

const printer = new PdfPrinter(fonts)

const currencyFormatter = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value || 0)
  } catch {
    return `$${Number(value || 0).toFixed(2)}`
  }
}

export async function buildInvoicePdf(invoice: Invoice, company: CompanyInfo) {
  const formatDate = (value?: Date) => (value ? new Date(value).toLocaleDateString() : '—')
  const taxRate = typeof invoice.taxRate === 'number' ? invoice.taxRate : 0
  const discountAmount = Number(invoice.discountAmount) || 0
  const netAmount = Math.max(invoice.subtotal - discountAmount, 0)
  const paymentsTotal = Array.isArray(invoice.payments)
    ? invoice.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    : 0
  const balanceDue = Math.max(invoice.total - paymentsTotal, 0)

  const labelCell = (text: string, extra: Record<string, unknown> = {}) => ({ text, ...extra } as any)
  const valueCell = (text: string, extra: Record<string, unknown> = {}) => ({ text, ...extra } as any)

  let logoImage: string | undefined
  if (company.logoUrl) {
    try {
      const response = await fetch(company.logoUrl)
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer())
        const mime = response.headers.get('content-type') || 'image/png'
        logoImage = `data:${mime};base64,${buffer.toString('base64')}`
      }
    } catch (error) {
      console.warn('Failed to load logo for invoice PDF', error)
    }
  }

  const itemRows = invoice.items.map((item) => {
    const area =
      typeof item.area === 'number'
        ? item.area
        : item.length && item.width
          ? Number(item.length) * Number(item.width)
          : null

    const vatAmount = taxRate ? (item.total * taxRate) / 100 : 0

    return [
      {
        stack: [
          { text: item.productName, style: 'tableItemTitle' },
          item.description ? { text: item.description, style: 'tableItemSub' } : null,
          area ? { text: `Area: ${area.toFixed(2)} m²`, style: 'tableItemSub' } : null,
          item.sizeLabel || item.origin
            ? {
                text: [item.sizeLabel || '', item.origin ? `• ${item.origin}` : ''].filter(Boolean).join(' '),
                style: 'tableItemSub'
              }
            : null
        ].filter(Boolean)
      },
      { text: (item.quantity || 0).toString(), alignment: 'right' },
      { text: currencyFormatter(item.price, invoice.currency), alignment: 'right' },
      {
        text: taxRate ? currencyFormatter(vatAmount, invoice.currency) : '—',
        alignment: 'right'
      },
      { text: currencyFormatter(item.total, invoice.currency), alignment: 'right' }
    ]
  })

  const totalsRows = [
    {
      label: labelCell('Subtotal'),
      value: valueCell(currencyFormatter(invoice.subtotal, invoice.currency))
    }
  ]

  if (discountAmount > 0) {
    totalsRows.push({
      label: labelCell('Discount'),
      value: valueCell(`-${currencyFormatter(discountAmount, invoice.currency)}`)
    })
  }

  totalsRows.push({
    label: labelCell(`Tax ${taxRate ? `(${taxRate.toFixed(2)}%)` : ''}`),
    value: valueCell(currencyFormatter(invoice.tax, invoice.currency))
  })

  totalsRows.push({
    label: labelCell('Total', { bold: true }),
    value: valueCell(currencyFormatter(invoice.total, invoice.currency), { bold: true })
  })

  if (paymentsTotal > 0) {
    totalsRows.push({
      label: labelCell('Payments'),
      value: valueCell(`-${currencyFormatter(paymentsTotal, invoice.currency)}`)
    })
  }

  totalsRows.push({
    label: labelCell('Balance Due', { bold: true, color: '#b91c1c' }),
    value: valueCell(currencyFormatter(balanceDue, invoice.currency), { bold: true, color: '#b91c1c' })
  })

  const vatSummary =
    taxRate > 0
      ? {
          margin: [0, 24, 0, 0],
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto'],
            body: [
              [
                { text: 'RATE', style: 'summaryHeader' },
                { text: 'TAX', style: 'summaryHeader' },
                { text: 'NET', style: 'summaryHeader' }
              ],
              [
                `${taxRate.toFixed(2)}%`,
                currencyFormatter(invoice.tax, invoice.currency),
                currencyFormatter(netAmount, invoice.currency)
              ]
            ]
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          }
        }
      : null

  const docDefinition = {
    pageMargins: [40, 70, 40, 60],
    content: [
      {
        columns: [
          [
            { text: company.name || 'Company', style: 'companyName' },
            company.address ? { text: company.address, style: 'companyInfo' } : null,
            company.phone ? { text: company.phone, style: 'companyInfo' } : null,
            company.email ? { text: company.email, style: 'companyInfo' } : null,
            company.website ? { text: company.website, style: 'companyInfo' } : null,
            company.taxId ? { text: `Tax Registration: ${company.taxId}`, style: 'companyInfo' } : null,
            company.bankDetails ? { text: `Bank Details:\n${company.bankDetails}`, style: 'companyInfo' } : null
          ].filter(Boolean),
          logoImage
            ? {
                image: logoImage,
                width: 140,
                alignment: 'right'
              }
            : null
        ]
          .filter(Boolean as any)
      },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 0.5, lineColor: '#e5e7eb' }
        ],
        margin: [0, 10, 0, 10]
      },
      {
        columns: [
          [
            { text: 'BILL TO', style: 'sectionHeader' },
            { text: invoice.customerName, style: 'billToName', margin: [0, 4, 0, 2] },
            invoice.customerEmail ? { text: invoice.customerEmail, style: 'billToDetail' } : null
          ].filter(Boolean),
          {
            width: 'auto',
            table: {
              body: [
                [{ text: 'INVOICE NO.', style: 'metaLabel' }, { text: invoice.invoiceNumber, style: 'metaValue' }],
                [{ text: 'DATE', style: 'metaLabel' }, { text: formatDate(invoice.invoiceDate || invoice.createdAt), style: 'metaValue' }],
                [{ text: 'DUE DATE', style: 'metaLabel' }, { text: formatDate(invoice.dueDate), style: 'metaValue' }],
                // [{ text: 'STATUS', style: 'metaLabel' }, { text: invoice.status.toUpperCase(), style: 'metaValue' }]
              ]
            },
            layout: 'noBorders',
            alignment: 'right'
          }
        ]
      },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 0.5, lineColor: '#e5e7eb' }
        ],
        margin: [0, 10, 0, 10]
      },
      // { text: 'Activity', style: 'sectionHeader', margin: [0, 30, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'DESCRIPTION', style: 'tableHeader' },
              { text: 'QTY', style: 'tableHeader', alignment: 'right' },
              { text: taxRate ? 'RATE (per m²)' : 'RATE', style: 'tableHeader', alignment: 'right' },
              { text: taxRate ? `VAT ${taxRate.toFixed(2)}%` : 'TAX', style: 'tableHeader', alignment: 'right' },
              { text: 'AMOUNT', style: 'tableHeader', alignment: 'right' }
            ],
            ...itemRows
          ]
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb'
        }
      },
      {
        columns: [
          [
            invoice.memo ? { text: `Notes:\n${invoice.memo}`, style: 'notes', margin: [0, 24, 0, 0] } : null
          ].filter(Boolean),
          {
            width: 240,
            table: {
              widths: ['*', 'auto'],
              body: totalsRows.map((row) => [
                { ...row.label, alignment: 'left' },
                { ...row.value, alignment: 'right' }
              ])
            },
            layout: {
              hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
              vLineWidth: () => 0,
              hLineColor: () => '#e5e7eb'
            },
            margin: [0, 24, 0, 0]
          }
        ]
      },
      vatSummary,
      invoice.terms ? { text: `Terms & Conditions:\n${invoice.terms}`, style: 'notes', margin: [0, 24, 0, 0] } : null
    ].filter(Boolean),
    styles: {
      companyName: { fontSize: 16, bold: true, color: '#1f2937' },
      companyInfo: { fontSize: 9, color: '#4b5563', margin: [0, 2, 0, 0] },
      metaLabel: { fontSize: 9, color: '#6b7280', bold: true, margin: [0, 2, 8, 2] },
      metaValue: { fontSize: 10, color: '#111827', margin: [0, 2, 0, 2] },
      sectionHeader: { fontSize: 12, bold: true, color: '#1f2937' },
      billToName: { fontSize: 11, bold: true, color: '#111827' },
      billToDetail: { fontSize: 10, color: '#4b5563' },
      tableHeader: { fontSize: 10, bold: true, color: '#1f2937', padding: [2, 2, 2, 2] },
      tableItemTitle: { fontSize: 10, bold: true, color: '#111827' },
      tableItemSub: { fontSize: 9, color: '#6b7280', margin: [0, 2, 0, 0] },
      notes: { fontSize: 9, color: '#4b5563' },
      summaryHeader: { fontSize: 9, bold: true, color: '#1f2937' }
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
      color: '#111827'
    }
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks: Buffer[] = []

  return await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })
}
