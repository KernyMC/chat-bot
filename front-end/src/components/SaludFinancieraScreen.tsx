import { useState, useEffect } from 'react'
import { getHealthMetrics, type HealthMetric } from '../services/backendService'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  green:  { label: 'Bien',        color: '#059669', bg: '#D1FAE5', iconBg: '#059669' },
  yellow: { label: 'Atención',    color: '#D97706', bg: '#FEF3C7', iconBg: '#D97706' },
  red:    { label: 'Revisar',     color: '#DC2626', bg: '#FEE2E2', iconBg: '#DC2626' },
  tip:    { label: 'Oportunidad', color: '#5B21B6', bg: '#EDE9FE', iconBg: '#5B21B6' },
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function Icon({ id, color = '#ffffff' }: { id: string; color?: string }) {
  const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.5 as number }
  if (id === 'tendencia') return (
    <svg {...s}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
  if (id === 'proveedor') return (
    <svg {...s}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  )
  if (id === 'flujo') return (
    <svg {...s}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
  if (id === 'categoria') return (
    <svg {...s}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
  // oportunidad / default
  return (
    <svg {...s}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ── Pregunta por métrica ──────────────────────────────────────────────────────
const METRIC_QUESTIONS: Record<string, string> = {
  tendencia:  '¿Cómo van mis ventas comparadas con los últimos meses?',
  proveedor:  '¿A qué proveedor le pago más dinero?',
  flujo:      '¿Cuánto vendí en total este año comparado con lo que gasté en proveedores?',
  categoria:  '¿Qué categoría me genera más ingresos?',
  oportunidad:'¿Qué día de la semana vendo más y qué día vendo menos?',
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ metric, onAsk }: { metric: HealthMetric; onAsk: (q: string) => void }) {
  const st = STATUS[metric.status]
  const question = METRIC_QUESTIONS[metric.id]
  return (
    <button
      onClick={() => question && onAsk(question)}
      style={{
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {/* Row: icon + title + badge + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: st.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon id={metric.id} />
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>
          {metric.titulo}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: st.color,
            background: st.bg,
            padding: '3px 10px',
            borderRadius: 20,
            flexShrink: 0,
          }}
        >
          {st.label}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      {/* Value + detail */}
      <div>
        <span style={{ fontSize: 30, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
          {metric.valor}
        </span>
        <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>
          {metric.detalle}
        </span>
      </div>

      {/* Advice */}
      <div
        style={{
          borderLeft: `3px solid ${st.color}`,
          paddingLeft: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
          {metric.consejo}
        </p>
      </div>
    </button>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6' }} />
        <div style={{ flex: 1, height: 14, background: '#F3F4F6', borderRadius: 6 }} />
        <div style={{ width: 56, height: 22, background: '#F3F4F6', borderRadius: 20 }} />
      </div>
      <div style={{ height: 30, width: '35%', background: '#F3F4F6', borderRadius: 6 }} />
      <div style={{ height: 13, width: '85%', background: '#F3F4F6', borderRadius: 6 }} />
    </div>
  )
}

// ── Summary pill ──────────────────────────────────────────────────────────────
function SummaryPill({ metrics }: { metrics: HealthMetric[] }) {
  const reds = metrics.filter(m => m.status === 'red').length
  const greens = metrics.filter(m => m.status === 'green').length
  if (reds > 1) return (
    <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '4px 14px', borderRadius: 20 }}>
      Necesita atención
    </span>
  )
  if (greens >= 3) return (
    <span style={{ fontSize: 13, fontWeight: 600, color: '#059669', background: '#D1FAE5', padding: '4px 14px', borderRadius: 20 }}>
      Negocio sano
    </span>
  )
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '4px 14px', borderRadius: 20 }}>
      Hay oportunidades
    </span>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
interface SaludFinancieraScreenProps {
  onBack: () => void
  onMiPana: (message?: string) => void
  comercioId?: string
  merchantName?: string
}

export default function SaludFinancieraScreen({
  onBack,
  onMiPana,
  comercioId = 'COM-001',
  merchantName = 'Mi Negocio',
}: SaludFinancieraScreenProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHealthMetrics(comercioId)
      .then(setMetrics)
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false))
  }, [comercioId])

  return (
    <div style={{ background: '#f2f2f7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 390,
          height: '100svh',
          maxHeight: 844,
          background: '#f2f2f7',
          borderRadius: 44,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header — white, same pattern as MiCajaScreen */}
        <div
          style={{
            background: '#ffffff',
            padding: '48px 20px 20px',
            flexShrink: 0,
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              marginBottom: 16,
              color: '#5B21B6',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
                Mi salud financiera
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>{merchantName}</p>
            </div>
            {!loading && metrics.length > 0 && <SummaryPill metrics={metrics} />}
          </div>
        </div>

        {/* Scrollable metric cards */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {loading
            ? [1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)
            : metrics.map(m => <MetricCard key={m.id} metric={m} onAsk={onMiPana} />)
          }
          <div style={{ height: 8 }} />
        </div>

        {/* CTA */}
        <div style={{ padding: '12px 16px 32px', background: '#f2f2f7', flexShrink: 0 }}>
          <button
            onClick={onMiPana}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 28,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              background: '#5B21B6',
              color: '#ffffff',
            }}
          >
            Habla con Mi Pana sobre esto
          </button>
        </div>
      </div>
    </div>
  )
}
