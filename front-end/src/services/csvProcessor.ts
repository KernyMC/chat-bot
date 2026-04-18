import csvRaw from '../assets/historial_transaccional.csv?raw'

interface Transaction {
  id: string
  comercioId: string
  fecha: Date
  tipo: 'Ingreso' | 'Egreso'
  categoria: string
  monto: number
  clienteId: string
  contrapartida: string
}

function parseCSV(): Transaction[] {
  const lines = csvRaw.trim().split('\n').slice(1) // omit header
  return lines.map((line) => {
    const parts = line.split(',')
    return {
      id: parts[0],
      comercioId: parts[1],
      fecha: new Date(parts[2].replace(' ', 'T')),
      tipo: parts[3] as 'Ingreso' | 'Egreso',
      categoria: parts[4],
      monto: parseFloat(parts[5]),
      clienteId: parts[6] ?? '',
      contrapartida: parts.slice(7).join(',').trim(),
    }
  })
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fmt(n: number) {
  return `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getSalesContext(comercioId = 'COM-001'): string {
  const all = parseCSV().filter((t) => t.comercioId === comercioId)
  const ingresos = all.filter((t) => t.tipo === 'Ingreso')
  const egresos = all.filter((t) => t.tipo === 'Egreso')

  const sumArr = (arr: Transaction[]) => arr.reduce((acc, t) => acc + t.monto, 0)
  const totalIngresos = sumArr(ingresos)
  const totalEgresos = sumArr(egresos)

  // Por mes
  const byMonth: Record<string, { sales: number; count: number }> = {}
  ingresos.forEach((t) => {
    const key = MONTH_NAMES[t.fecha.getMonth()]
    if (!byMonth[key]) byMonth[key] = { sales: 0, count: 0 }
    byMonth[key].sales += t.monto
    byMonth[key].count++
  })

  // Por categoría
  const byCategory: Record<string, number> = {}
  ingresos.forEach((t) => {
    byCategory[t.categoria] = (byCategory[t.categoria] ?? 0) + t.monto
  })
  const categorySorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  // Top clientes
  const byClient: Record<string, { name: string; total: number; count: number }> = {}
  ingresos.forEach((t) => {
    if (!t.clienteId) return
    if (!byClient[t.clienteId]) byClient[t.clienteId] = { name: t.contrapartida, total: 0, count: 0 }
    byClient[t.clienteId].total += t.monto
    byClient[t.clienteId].count++
  })
  const topClients = Object.values(byClient)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Gastos por categoría
  const byExpense: Record<string, number> = {}
  egresos.forEach((t) => {
    byExpense[t.categoria] = (byExpense[t.categoria] ?? 0) + t.monto
  })

  // Diciembre por semana (último mes del dataset)
  const december = ingresos.filter((t) => t.fecha.getMonth() === 11)
  const byWeek: Record<string, number> = {
    'Semana 1 (1-7 dic)': 0,
    'Semana 2 (8-14 dic)': 0,
    'Semana 3 (15-21 dic)': 0,
    'Semana 4 (22-31 dic)': 0,
  }
  december.forEach((t) => {
    const day = t.fecha.getDate()
    if (day <= 7) byWeek['Semana 1 (1-7 dic)'] += t.monto
    else if (day <= 14) byWeek['Semana 2 (8-14 dic)'] += t.monto
    else if (day <= 21) byWeek['Semana 3 (15-21 dic)'] += t.monto
    else byWeek['Semana 4 (22-31 dic)'] += t.monto
  })

  return `
DATOS REALES DEL NEGOCIO (${comercioId}, año 2023):

RESUMEN ANUAL:
- Total ingresos: ${fmt(totalIngresos)} (${ingresos.length} transacciones)
- Total egresos: ${fmt(totalEgresos)} (${egresos.length} transacciones)
- Balance neto: ${fmt(totalIngresos - totalEgresos)}

INGRESOS POR MES:
${MONTH_NAMES.map((m) => {
    const d = byMonth[m]
    return d ? `${m}: ${fmt(d.sales)} (${d.count} ventas)` : `${m}: $0.00 (0 ventas)`
  }).join('\n')}

INGRESOS POR CATEGORÍA:
${categorySorted.map(([cat, amt]) => `${cat}: ${fmt(amt)} (${((amt / totalIngresos) * 100).toFixed(1)}%)`).join('\n')}

TOP 5 CLIENTES (por monto total):
${topClients.map((c, i) => `${i + 1}. ${c.name} — ${fmt(c.total)} total, ${c.count} compras`).join('\n')}

PRINCIPALES GASTOS:
${Object.entries(byExpense)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${fmt(v)}`)
    .join('\n')}

DICIEMBRE 2023 POR SEMANA:
${Object.entries(byWeek).map(([k, v]) => `${k}: ${fmt(v)}`).join('\n')}
`.trim()
}

export function getRawTransactions(comercioId = 'COM-001'): Transaction[] {
  return parseCSV().filter((t) => t.comercioId === comercioId)
}
