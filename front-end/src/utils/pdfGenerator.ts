import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PDFReportData {
  title: string
  period: string
  summary: string
  tableData: Array<{ label: string; amount: number; transactions?: number }>
  totalAmount: number
  storeName?: string
}

export function generateSalesPDF(data: PDFReportData): void {
  const doc = new jsPDF()
  const purple: [number, number, number] = [91, 33, 182]
  const teal: [number, number, number] = [15, 118, 110]

  // Header bar
  doc.setFillColor(...purple)
  doc.rect(0, 0, 210, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.title, 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${data.storeName ?? 'Mi Tienda'} · Generado el ${new Date().toLocaleDateString('es-EC')}`,
    14,
    30
  )

  // Summary text
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'italic')
  const summaryLines = doc.splitTextToSize(data.summary, 182)
  doc.text(summaryLines, 14, 50)

  // Total highlight box
  const boxY = 50 + summaryLines.length * 6 + 6
  doc.setFillColor(237, 233, 254)
  doc.roundedRect(14, boxY, 95, 20, 4, 4, 'F')
  doc.setTextColor(...purple)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Total del período', 20, boxY + 8)
  doc.setFontSize(15)
  doc.text(
    `$${data.totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
    20,
    boxY + 16
  )

  // Data table
  const tableY = boxY + 28
  const hasTransactions = data.tableData.some((r) => r.transactions != null)
  const head = hasTransactions
    ? [['Período', 'Ventas (USD)', 'Transacciones']]
    : [['Período', 'Ventas (USD)']]
  const body = data.tableData.map((row) => {
    const amount = `$${row.amount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
    return hasTransactions
      ? [row.label, amount, row.transactions?.toString() ?? '—']
      : [row.label, amount]
  })
  const foot = hasTransactions
    ? [['TOTAL', `$${data.totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, '']]
    : [['TOTAL', `$${data.totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`]]

  autoTable(doc, {
    startY: tableY,
    head,
    body,
    foot,
    headStyles: { fillColor: purple, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 245, 255] },
    footStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(...teal)
  doc.rect(0, pageH - 12, 210, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Generado por Mi Pana · DeUna Negocios', 14, pageH - 4)

  const periodLabel: Record<string, string> = {
    weekly: 'semanal',
    monthly: 'mensual',
    annual: 'anual',
  }
  doc.save(`reporte-ventas-${periodLabel[data.period] ?? data.period}.pdf`)
}
