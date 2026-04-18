import { useState } from 'react'
import BottomNavBar, { type NavTab } from './BottomNavBar'

// Quick action button component
function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        flex: 1,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '1.5px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: 12,
          color: '#111827',
          fontWeight: 500,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 70,
        }}
      >
        {label}
      </span>
    </button>
  )
}

// Feature card component
function FeatureCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#F5F5F0',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 110,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          color: '#0F766E',
          lineHeight: 1.35,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

// Deuna badge
function DeunaBadge() {
  return (
    <div
      style={{
        background: '#0F766E',
        borderRadius: 6,
        padding: '4px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 12,
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}
      >
        d!
      </span>
      <span
        style={{
          color: '#ffffff',
          fontSize: 7,
          fontWeight: 500,
          marginLeft: 2,
          opacity: 0.9,
        }}
      >
        Negocios
      </span>
    </div>
  )
}

// Payment method toggle
type PaymentMethod = 'qr' | 'tarjeta' | 'manual'

function PaymentMethodToggle({
  selected,
  onChange,
}: {
  selected: PaymentMethod
  onChange: (method: PaymentMethod) => void
}) {
  const methods: { key: PaymentMethod; label: string }[] = [
    { key: 'qr', label: 'QR' },
    { key: 'tarjeta', label: 'Tarjeta' },
    { key: 'manual', label: 'Manual' },
  ]

  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1.5px solid #E5E7EB',
        borderRadius: 50,
        overflow: 'hidden',
      }}
    >
      {methods.map((method) => (
        <button
          key={method.key}
          onClick={() => onChange(method.key)}
          style={{
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 24,
            paddingRight: 24,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            background: selected === method.key ? '#3B0764' : 'transparent',
            color: selected === method.key ? '#ffffff' : '#4B5563',
            transition: 'all 0.2s',
          }}
        >
          {method.label}
        </button>
      ))}
    </div>
  )
}

// Numeric keypad
function NumericKeypad({
  onKeyPress,
  onDelete,
}: {
  onKeyPress: (key: string) => void
  onDelete: () => void
}) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [',', '0', 'delete'],
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 32px',
      }}
    >
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          {row.map((key) => (
            <button
              key={key}
              onClick={() => (key === 'delete' ? onDelete() : onKeyPress(key))}
              style={{
                width: 72,
                height: 56,
                borderRadius: 12,
                border: 'none',
                background: key === 'delete' ? 'transparent' : '#F3F4F6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 500,
                color: '#111827',
                transition: 'background 0.1s',
              }}
              onTouchStart={(e) => {
                if (key !== 'delete') {
                  e.currentTarget.style.background = '#E5E7EB'
                }
              }}
              onTouchEnd={(e) => {
                if (key !== 'delete') {
                  e.currentTarget.style.background = '#F3F4F6'
                }
              }}
            >
              {key === 'delete' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// Cobrar Tab Content
function CobrarContent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr')
  const [amount, setAmount] = useState('0')

  const handleKeyPress = (key: string) => {
    setAmount((prev) => {
      if (prev === '0' && key !== ',') {
        return key
      }
      if (key === ',' && prev.includes(',')) {
        return prev
      }
      // Limit decimal places
      const parts = prev.split(',')
      if (parts[1] && parts[1].length >= 2) {
        return prev
      }
      return prev + key
    })
  }

  const handleDelete = () => {
    setAmount((prev) => {
      if (prev.length === 1) {
        return '0'
      }
      return prev.slice(0, -1)
    })
  }

  const isButtonEnabled = amount !== '0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Amount display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 24,
          paddingBottom: 20,
        }}
      >
        <span style={{ fontSize: 16, color: '#7C3AED', fontWeight: 500, marginBottom: 8 }}>Monto</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>$</span>
          <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>{amount}</span>
        </div>
      </div>

      {/* Payment method toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <PaymentMethodToggle selected={paymentMethod} onChange={setPaymentMethod} />
      </div>

      {/* Agregar motivo */}
      <button
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          borderTop: '1px solid #E5E7EB',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 15, color: '#111827', fontWeight: 400 }}>Agregar motivo (opcional)</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Numeric keypad */}
      <div style={{ borderTop: '1px solid #E5E7EB' }}>
        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Continue button */}
      <div style={{ padding: '16px 20px', paddingBottom: 8 }}>
        <button
          disabled={!isButtonEnabled}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 16,
            border: 'none',
            cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
            fontSize: 17,
            fontWeight: 700,
            background: isButtonEnabled ? '#3B0764' : '#E5E7EB',
            color: isButtonEnabled ? '#ffffff' : '#9CA3AF',
            transition: 'all 0.2s',
          }}
        >
          Continuar para Cobrar
        </button>
      </div>
    </div>
  )
}

// Gestionar Tab Content
function GestionarContent({
  balanceHidden,
  setBalanceHidden,
}: {
  balanceHidden: boolean
  setBalanceHidden: (v: boolean) => void
}) {
  return (
    <>
      {/* Mi Saldo Card */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7280', marginBottom: 6 }}>Mi Saldo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>$</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: 2 }}>
                {balanceHidden ? '*******' : '1,234.56'}
              </span>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {balanceHidden ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div style={{ padding: '24px 20px 0 20px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Accesos rápidos
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <QuickAction
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            }
            label="Recargar saldo"
          />
          <QuickAction
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            }
            label="Transferir saldo"
          />
          <QuickAction
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5">
                <text x="12" y="17" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827" stroke="none">
                  $
                </text>
              </svg>
            }
            label="Venta Manual"
          />
          <QuickAction
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            label="Verificar pago"
          />
        </div>
      </div>

      {/* Novedades Deuna Negocios */}
      <div style={{ padding: '28px 20px 20px 20px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Novedades Deuna Negocios
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <FeatureCard title="Agrega vendedores a tu equipo">
            <DeunaBadge />
          </FeatureCard>
          <FeatureCard title="Administra tus ventas con tu caja">
            <DeunaBadge />
          </FeatureCard>
        </div>
      </div>
    </>
  )
}

interface HomeScreenProps {
  onNavigate?: (screen: 'home' | 'mi-caja' | 'menu') => void
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'cobrar' | 'gestionar'>('gestionar')
  const [balanceHidden, setBalanceHidden] = useState(true)
  const [navTab, setNavTab] = useState<NavTab>('inicio')

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab === 'mi-caja' && onNavigate) {
      onNavigate('mi-caja')
    } else if (tab === 'menu' && onNavigate) {
      onNavigate('menu')
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
        {/* Scrollable content */}
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
          {/* Header with user info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Store avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#5B21B6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Hola! Kevin</span>
                  <span
                    style={{
                      background: '#EDE9FE',
                      color: '#5B21B6',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}
                  >
                    Admin
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  Vargas Paladines Kevin...
                </p>
              </div>
            </div>
            {/* Right icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* QR Scanner */}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3z" />
                  <path d="M17 17h4v4h-4z" />
                </svg>
              </button>
              {/* Bell */}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </button>
              {/* Headphones */}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#111827">
                  <path d="M12 3C7.03 3 3 7.03 3 12v7c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-1c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs: Cobrar / Gestionar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E5E7EB',
              marginLeft: 20,
              marginRight: 20,
            }}
          >
            <button
              onClick={() => setActiveTab('cobrar')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 15,
                fontWeight: activeTab === 'cobrar' ? 600 : 500,
                color: activeTab === 'cobrar' ? '#5B21B6' : '#6B7280',
                borderBottom: activeTab === 'cobrar' ? '3px solid #5B21B6' : '3px solid transparent',
                marginBottom: -1,
              }}
            >
              Cobrar
            </button>
            <button
              onClick={() => setActiveTab('gestionar')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 15,
                fontWeight: activeTab === 'gestionar' ? 600 : 500,
                color: activeTab === 'gestionar' ? '#5B21B6' : '#6B7280',
                borderBottom: activeTab === 'gestionar' ? '3px solid #5B21B6' : '3px solid transparent',
                marginBottom: -1,
              }}
            >
              Gestionar
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'cobrar' ? (
            <CobrarContent />
          ) : (
            <GestionarContent balanceHidden={balanceHidden} setBalanceHidden={setBalanceHidden} />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />
      </div>
    </div>
  )
}
