import type { ChartDataPoint, ChartType } from '../types/chat'
import type { PDFReportData } from '../utils/pdfGenerator'

const BASE_URL = '/api'

let _comercioId = 'COM-001'
export const setComercioId = (id: string) => { _comercioId = id }
export const getComercioId = () => _comercioId

export interface BackendChatResponse {
  text: string
  chart: { chartType: ChartType; title: string; data: ChartDataPoint[] } | null
  pdfData: PDFReportData | null
  scope?: string
  productoUrl?: string
}

// ── Plotly JSON → Recharts-compatible format ──────────────────────────────────

function plotlyToChart(
  plotlyJson: Record<string, unknown>
): BackendChatResponse['chart'] {
  const traces = plotlyJson?.data as Record<string, unknown>[] | undefined
  const layout = plotlyJson?.layout as Record<string, unknown> | undefined
  const trace = traces?.[0]
  if (!trace) return null

  const rawTitle = layout?.title
  const title =
    typeof rawTitle === 'string'
      ? rawTitle
      : (rawTitle as Record<string, unknown> | undefined)?.text != null
        ? String((rawTitle as Record<string, unknown>).text)
        : ''

  const type = String(trace.type ?? '')

  if (type === 'bar' || type === 'scatter') {
    const xs = trace.x as unknown[]
    const ys = trace.y as number[]
    if (!xs?.length || !ys?.length) return null
    return {
      chartType: 'bar',
      title,
      data: xs.map((x, i) => ({ name: String(x), value: Number(ys[i]) })),
    }
  }

  if (type === 'pie') {
    const labels = trace.labels as string[]
    const values = trace.values as number[]
    if (!labels?.length || !values?.length) return null
    return {
      chartType: 'pie',
      title,
      data: labels.map((l, i) => ({ name: l, value: Number(values[i]) })),
    }
  }

  if (type === 'heatmap') {
    // Flatten to bar chart: sum each column (hour) across all rows (days)
    const xs = trace.x as string[]
    const z = trace.z as number[][]
    if (!xs?.length || !z?.length) return null
    return {
      chartType: 'bar',
      title,
      data: xs.map((x, i) => ({
        name: x,
        value: z.reduce((sum, row) => sum + (row[i] ?? 0), 0),
      })),
    }
  }

  return null
}

// ── sql_result → PDFReportData ────────────────────────────────────────────────

function sqlResultToPdfData(
  sqlResult: Record<string, unknown>[],
  response: string,
  reportType: string
): PDFReportData {
  const sample = sqlResult[0] ?? {}

  const labelKey =
    ['semana', 'mes', 'dia', 'proveedor', 'categoria', 'nombre_cliente'].find(
      (k) => k in sample
    ) ?? Object.keys(sample)[0] ?? 'label'

  const amountKey =
    ['total', 'total_pagado', 'ingreso_total', 'total_gastado'].find(
      (k) => k in sample
    ) ?? 'total'

  const txKey = ['num_transacciones', 'num_pedidos', 'visitas'].find(
    (k) => k in sample
  )

  const tableData = sqlResult.map((row) => ({
    label: String(row[labelKey] ?? ''),
    amount: Number(row[amountKey] ?? 0),
    ...(txKey != null ? { transactions: Number(row[txKey]) } : {}),
  }))

  const totalAmount = tableData.reduce((s, r) => s + r.amount, 0)

  const titles: Record<string, string> = {
    weekly: 'Reporte Semanal de Ventas',
    monthly: 'Reporte Mensual de Ventas',
    annual: 'Reporte Anual de Ventas',
  }

  return {
    title: titles[reportType] ?? 'Reporte de Ventas',
    period: reportType,
    summary: response,
    tableData,
    totalAmount,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackendSuggestion {
  title: string
  message: string
  icon: 'growth' | 'alert' | 'tip' | 'payment'
  url: string | null
}

// Strips **bold** markdown from proactive.py messages
function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getSuggestions(comercioId?: string): Promise<BackendSuggestion[]> {
  const id = comercioId ?? _comercioId
  const res = await fetch(`${BASE_URL}/suggestions?comercio_id=${id}`)
  if (!res.ok) throw new Error(`Suggestions error (${res.status})`)
  const data = await res.json()
  return ((data.suggestions ?? []) as BackendSuggestion[]).map((s) => ({
    ...s,
    message: stripMarkdown(s.message),
  }))
}

export async function getWelcomeMessage(comercioId?: string): Promise<string> {
  const id = comercioId ?? _comercioId
  const res = await fetch(`${BASE_URL}/welcome?comercio_id=${id}`)
  if (!res.ok) return '¡Oe, veci! Soy Mi Pana. Pregúntame lo que necesites.'
  const data = await res.json()
  return String(data.message ?? '')
}

export async function sendToBackend(message: string, comercioId?: string): Promise<BackendChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, comercio_id: comercioId ?? _comercioId }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error del servidor (${res.status}): ${err}`)
  }

  const data = await res.json()
  return {
    text: String(data.response ?? ''),
    chart: data.chart ? plotlyToChart(data.chart as Record<string, unknown>) : null,
    pdfData: null,
    scope: String(data.scope ?? ''),
    productoUrl: data.producto_url ? String(data.producto_url) : undefined,
  }
}

export interface HealthMetric {
  id: string
  emoji: string
  titulo: string
  valor: string
  detalle: string
  consejo: string
  status: 'green' | 'yellow' | 'red' | 'tip'
}

export async function getHealthMetrics(comercioId?: string): Promise<HealthMetric[]> {
  const id = comercioId ?? _comercioId
  const res = await fetch(`${BASE_URL}/health?comercio_id=${id}`)
  if (!res.ok) throw new Error(`Health error (${res.status})`)
  const data = await res.json()
  return (data.metrics ?? []) as HealthMetric[]
}

export async function getReportFromBackend(
  type: 'weekly' | 'monthly' | 'annual',
  comercioId?: string,
): Promise<BackendChatResponse> {
  const res = await fetch(`${BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, comercio_id: comercioId ?? _comercioId }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error del servidor (${res.status}): ${err}`)
  }

  const data = await res.json()
  const sqlResult = (data.sql_result ?? []) as Record<string, unknown>[]
  const response = String(data.response ?? '')

  return {
    text: response,
    chart: data.chart ? plotlyToChart(data.chart as Record<string, unknown>) : null,
    pdfData: sqlResultToPdfData(sqlResult, response, String(data.report_type ?? type)),
  }
}
