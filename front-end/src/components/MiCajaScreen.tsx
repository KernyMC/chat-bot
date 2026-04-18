import { createElement, useState } from 'react'
import BottomNavBar, { type NavTab } from './BottomNavBar'

// Mock data for sales
const MOCK_SALES = [
  { id: 1, initials: 'TS', name: 'Tania Magaly Suarez Barreiro', date: '17 Abr 7:06 pm', amount: 2.75 },
  { id: 2, initials: 'FZ', name: 'Fernando Jose Zhapa Zhapa', date: '17 Abr 7:06 pm', amount: 3.15 },
  { id: 3, initials: 'MC', name: 'Melani Anahi Cajas Sanchez', date: '17 Abr 7:01 pm', amount: 9.00 },
  { id: 4, initials: 'MC', name: 'Michael Didian Chavez Quinga', date: '17 Abr 6:34 pm', amount: 2.00 },
  { id: 5, initials: 'RC', name: 'Raul Eduardo Caiza Tepan', date: '17 Abr 6:30 pm', amount: 11.00 },
]

// Sale item component
function SaleItem({
  initials,
  name,
  date,
  amount,
}: {
  initials: string
  name: string
  date: string
  amount: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 0',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#EDE9FE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#5B21B6' }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280', marginTop: 2 }}>{date}</p>
      </div>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#059669', flexShrink: 0 }}>
        +$ {amount.toFixed(2).replace('.', ',')}
      </span>
    </div>
  )
}

// Caja Activa Tab Content
function CajaActivaContent() {
  const totalBalance = 4776.27

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Balance Card */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <div
          style={{
            background: '#F9FAFB',
            borderRadius: 16,
            padding: '20px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Mi caja</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: '#111827' }}>
            ${totalBalance.toLocaleString('es-EC', { minimumFractionDigits: 2 }).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Total info */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: '#6B7280',
          textAlign: 'center',
          padding: '16px 20px',
        }}
      >
        <span style={{ fontWeight: 600, color: '#111827' }}>Total</span> al 22/01/2026, 09:37 am -
      </p>

      {/* Mis ventas section */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Mis ventas</h2>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#EDE9FE',
              border: 'none',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: '#5B21B6',
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            + Agregar venta manual
          </button>
        </div>

        {/* Sales list */}
        <div>
          {MOCK_SALES.map((sale) => (
            <SaleItem
              key={sale.id}
              initials={sale.initials}
              name={sale.name}
              date={sale.date}
              amount={sale.amount}
            />
          ))}
        </div>
      </div>

      {/* Cerrar caja button */}
      <div style={{ padding: '16px 20px', paddingBottom: 8 }}>
        <button
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 16,
            border: 'none',
            cursor: 'pointer',
            fontSize: 17,
            fontWeight: 700,
            background: '#5B21B6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Cerrar caja
        </button>
      </div>
    </div>
  )
}

// Historial Tab Content
function HistorialContent() {
  const [filter, setFilter] = useState<'hoy' | 'ayer' | 'semana'>('hoy')

  const filters: { key: 'hoy' | 'ayer' | 'semana'; label: string }[] = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'ayer', label: 'Ayer' },
    { key: 'semana', label: 'Semana' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0 20px' }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '10px 20px',
              borderRadius: 24,
              border: filter === f.key ? '2px solid #5B21B6' : '1.5px solid #E5E7EB',
              background: '#ffffff',
              fontSize: 14,
              fontWeight: 500,
              color: filter === f.key ? '#111827' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Amount Card */}
      <div style={{ padding: '20px' }}>
        <div
          style={{
            background: '#F9FAFB',
            borderRadius: 16,
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: '#111827' }}>$0,00</p>
        </div>
      </div>

      {/* Empty state */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Wallet illustration */}
        <div style={{ marginBottom: 20, position: 'relative', width: 140, height: 120 }}>
          {/* Base/shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 12,
              background: 'linear-gradient(180deg, #FED7D7 0%, #FEB2B2 100%)',
              borderRadius: '50%',
            }}
          />
          {/* Wallet body */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80,
              height: 60,
              background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
              borderRadius: 12,
            }}
          />
          {/* Money/bills */}
          <div
            style={{
              position: 'absolute',
              bottom: 45,
              left: '50%',
              transform: 'translateX(-50%) rotate(-15deg)',
              width: 60,
              height: 35,
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)',
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 55,
              left: '55%',
              transform: 'translateX(-50%) rotate(10deg)',
              width: 55,
              height: 32,
              background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)',
              borderRadius: 4,
            }}
          />
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: 25,
              right: 20,
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </div>
          {/* Coins */}
          <div
            style={{
              position: 'absolute',
              top: 15,
              right: 25,
              width: 20,
              height: 20,
              background: 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 5,
              right: 10,
              width: 14,
              height: 14,
              background: 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)',
              borderRadius: '50%',
            }}
          />
        </div>

        <p style={{ margin: 0, fontSize: 16, color: '#9CA3AF', fontWeight: 400 }}>
          No hay ventas todavía
        </p>
      </div>
    </div>
  )
}

interface MiCajaScreenProps {
  onBack: () => void
}

export default function MiCajaScreen({ onBack }: MiCajaScreenProps) {
  const [activeTab, setActiveTab] = useState<'caja-activa' | 'historial'>('caja-activa')
  const [navTab, setNavTab] = useState<NavTab>('mi-caja')

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab !== 'mi-caja') {
      onBack()
    }
  }

  return (
    <div
      style={{
        background: '#f2f2f7',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Device shell */}
      <div
        style={{
          width: 390,
          height: '100svh',
          maxHeight: 844,
          background: '#ffffff',
          borderRadius: 44,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 20px 16px 20px',
            position: 'relative',
          }}
        >
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              left: 20,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Mi caja dropdown */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#111827',
              border: 'none',
              borderRadius: 24,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>Mi caja</span>
            {createElement('ion-icon', {
              name: 'chevron-down-circle',
              style: { fontSize: 16, color: '#ffffff' },
            })}
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
            marginLeft: 20,
            marginRight: 20,
          }}
        >
          <button
            onClick={() => setActiveTab('caja-activa')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              fontWeight: activeTab === 'caja-activa' ? 600 : 500,
              color: activeTab === 'caja-activa' ? '#5B21B6' : '#6B7280',
              borderBottom: activeTab === 'caja-activa' ? '3px solid #5B21B6' : '3px solid transparent',
              marginBottom: -1,
            }}
          >
            Caja activa
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              fontWeight: activeTab === 'historial' ? 600 : 500,
              color: activeTab === 'historial' ? '#5B21B6' : '#6B7280',
              borderBottom: activeTab === 'historial' ? '3px solid #5B21B6' : '3px solid transparent',
              marginBottom: -1,
            }}
          >
            Historial
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 100,
          }}
        >
          {activeTab === 'caja-activa' ? <CajaActivaContent /> : <HistorialContent />}
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />
      </div>
    </div>
  )
}
