import path from 'node:path'
import PdfPrinter from 'pdfmake'
import type { Invoice } from '../api/invoices/index.get'
import type { CompanyInfo } from './invoiceTemplate'

const fonts = {
  Roboto: {
    normal: path.resolve(process.cwd(), 'node_modules/pdfmake/examples/fonts/Roboto-Regular.ttf'),
    bold: path.resolve(process.cwd(), 'node_modules/pdfmake/examples/fonts/Roboto-Medium.ttf'),
    italics: path.resolve(process.cwd(), 'node_modules/pdfmake/examples/fonts/Roboto-Italic.ttf'),
    bolditalics: path.resolve(process.cwd(), 'node_modules/pdfmake/examples/fonts/Roboto-MediumItalic.ttf')
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
  const docDefinition = {
    content: [
      {
        columns: [
          [
            { text: `Invoice ${invoice.invoiceNumber}`, style: 'title' },
            { text: `Date: ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}`, style: 'subheader' },
            invoice.dueDate
              ? { text: `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, style: 'subheader' }
              : null,
            { text: `Status: ${invoice.status.toUpperCase()}`, style: 'subheader' }
          ].filter(Boolean),
          [
            { text: company.name, style: 'company' },
            company.address ? { text: company.address } : null,
            company.phone ? { text: company.phone } : null,
            company.email ? { text: company.email } : null,
            company.website ? { text: company.website } : null,
            company.bankDetails ? { text: `Bank Details:\n${company.bankDetails}` } : null
          ].filter(Boolean)
        ]
      },
      { text: 'Bill To', style: 'sectionHeader', margin: [0, 20, 0, 6] },
      {
        ul: [
          `${invoice.customerName}`,
          `${invoice.customerEmail}`
        ]
      },
      { text: 'Items', style: 'sectionHeader', margin: [0, 20, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Quantity', style: 'tableHeader' },
              { text: 'Price', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' }
            ],
            ...invoice.items.map((item) => [
              {
                stack: [
                  { text: item.productName, style: 'tableItemTitle' },
                  item.sizeLabel || item.origin
                    ? { text: `${item.sizeLabel || ''} ${item.origin ? `• ${item.origin}` : ''}`, style: 'tableItemSub' }
                    : null
                ].filter(Boolean)
              },
              { text: item.quantity.toString(), alignment: 'right' },
              { text: currencyFormatter(item.price, invoice.currency), alignment: 'right' },
              { text: currencyFormatter(item.total, invoice.currency), alignment: 'right' }
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      {
        columns: [
          { text: invoice.memo ? `Memo:\n${invoice.memo}` : '', margin: [0, 20, 0, 0] },
          {
            width: 'auto',
            table: {
              body: [
                ['Subtotal', currencyFormatter(invoice.subtotal, invoice.currency)],
                ['Tax', currencyFormatter(invoice.tax, invoice.currency)],
                [{ text: 'Total', bold: true }, { text: currencyFormatter(invoice.total, invoice.currency), bold: true }]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 20, 0, 0]
          }
        ]
      },
      invoice.terms ? { text: `Terms: ${invoice.terms}`, margin: [0, 20, 0, 0] } : null
    ].filter(Boolean),
    styles: {
      title: { fontSize: 20, bold: true },
      subheader: { fontSize: 10, margin: [0, 2, 0, 0], color: '#555' },
      company: { fontSize: 12, bold: true },
      sectionHeader: { fontSize: 13, bold: true },
      tableHeader: { fontSize: 10, bold: true, color: '#4b5563' },
      tableItemTitle: { fontSize: 11, bold: true },
      tableItemSub: { fontSize: 9, color: '#6b7280' }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10
    }
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks: Buffer[] = []

  return await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (chunk) => chunks.push(chunk))
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })
}
