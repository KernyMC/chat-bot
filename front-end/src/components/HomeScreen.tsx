import { createElement, useState, useEffect } from 'react'
import BottomNavBar, { type NavTab } from './BottomNavBar'
import NotificationDropdown, { useNotifications, useSwipeDown } from './NotificationDropdown'
import AppNotifications, { usePaymentNotifications, useMiPanaNotifications } from './AppNotifications'
import { getSuggestions } from '../services/backendService'
import qrCodeIcon from '../assets/qrcode.svg'
import headphonesIcon from '../assets/audifonos.svg'
import bellIcon from '../assets/campana.svg'
import bannerMiPana from '../assets/bannermipana.png'

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
        borderRadius: 8,
        padding: '6px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
      }}
    >
      <img
        src="/deunablanco.svg"
        alt="deuna badge"
        style={{
          width: 24,
          height: 24,
          objectFit: 'contain',
        }}
      />
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
        background: '#F3F4F6',
        borderRadius: 20,
        padding: 3,
      }}
    >
      {methods.map((method) => (
        <button
          key={method.key}
          onClick={() => onChange(method.key)}
          style={{
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 18,
            paddingRight: 18,
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            background: selected === method.key ? '#5B21B6' : 'transparent',
            color: selected === method.key ? '#ffffff' : '#374151',
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
        gap: 0,
        padding: '8px 24px 0',
      }}
    >
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', justifyContent: 'space-around' }}>
          {row.map((key) => (
            <button
              key={key}
              onClick={() => (key === 'delete' ? onDelete() : onKeyPress(key))}
              style={{
                width: 80,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 400,
                color: '#1F2937',
              }}
            >
              {key === 'delete' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" fill="none" />
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
        <span style={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>Monto</span>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 48, fontWeight: 600, color: '#111827', lineHeight: 1 }}>$ {amount}</span>
        </div>
      </div>

      {/* Payment method toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
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
          borderBottom: '1px solid #E5E7EB',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 15, color: '#6B7280', fontWeight: 400 }}>Agregar motivo (opcional)</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Numeric keypad */}
      <div>
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
            borderRadius: 28,
            border: 'none',
            cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
            fontSize: 16,
            fontWeight: 600,
            background: isButtonEnabled ? '#5B21B6' : '#E5E7EB',
            color: isButtonEnabled ? '#ffffff' : '#6B7280',
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
  onMiPanaClick,
  onSaludClick,
}: {
  balanceHidden: boolean
  setBalanceHidden: (v: boolean) => void
  onMiPanaClick: () => void
  onSaludClick: () => void
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
          <div style={{ textAlign: 'left' }}>
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
                  createElement('ion-icon', { name: 'eye-off', style: { fontSize: 22, color: '#202020' } })
                ) : (
                  createElement('ion-icon', { name: 'eye', style: { fontSize: 22, color: '#202020' } })
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

      {/* Banner Mi Pana */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <button
          onClick={onMiPanaClick}
          style={{
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <img
            src={bannerMiPana}
            alt="Habla con Mi Pana"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 16,
            }}
          />
        </button>
      </div>

      {/* Mi salud financiera */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <button
          onClick={onSaludClick}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '16px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#EDE9FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Mi salud financiera
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>
              Tendencia, flujo, riesgos y oportunidades
            </p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Novedades Deuna Negocios */}
      <div style={{ padding: '20px 20px 20px 20px' }}>
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
  onNavigate?: (screen: 'home' | 'mi-caja' | 'mi-pana' | 'menu' | 'salud') => void
  comercioId?: string
  merchantName?: string
}

export default function HomeScreen({ onNavigate, comercioId = 'COM-001', merchantName = 'Mi Negocio' }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'cobrar' | 'gestionar'>('gestionar')
  const [balanceHidden, setBalanceHidden] = useState(true)
  const [navTab, setNavTab] = useState<NavTab>('inicio')
  const [showNativeNotifications, setShowNativeNotifications] = useState(false)
  const [showAppNotifications, setShowAppNotifications] = useState(false)
  const { notifications, addNotification } = useNotifications()
  const { notifications: paymentNotifications, addPaymentNotification, count: paymentCount } = usePaymentNotifications()
  const { notifications: miPanaAppNotifications, addMiPanaNotification, count: miPanaCount } = useMiPanaNotifications()

  // Hook para activar notificaciones nativas con long press + swipe down
  const { containerRef, handlers: swipeHandlers, isLongPressed, swipeProgress } = useSwipeDown(() => {
    setShowNativeNotifications(true)
  })

  // Agregar notificaciones de ejemplo al montar
  useEffect(() => {
    let ignore = false

    // Notificaciones de Mi Pana desde el backend (campana + swipe-down)
    getSuggestions(comercioId)
      .then((suggestions) => {
        if (!ignore) {
          suggestions.forEach((s) => {
            addNotification(s.title, s.message, s.icon)
            addMiPanaNotification(s.title, s.message, s.icon)
          })
        }
      })
      .catch(() => {
        if (!ignore) {
          addNotification('Mi Pana', 'Conecta el backend para ver sugerencias reales.', 'tip')
          addMiPanaNotification('Crecimiento semanal', 'Conecta el backend para ver sugerencias reales.', 'tip')
        }
      })

    // Notificaciones de pagos de la app
    addPaymentNotification(7.15, 'Jimmy Wladimir Ango Llulluna', '2549')
    setTimeout(() => { if (!ignore) addPaymentNotification(10.00, 'Adriana Elizabeth Alvarez Carrasco', '3337') }, 100)
    setTimeout(() => { if (!ignore) addPaymentNotification(4.50, 'Karen Anahi Vasco Usina', '2365') }, 200)
    setTimeout(() => { if (!ignore) addPaymentNotification(14.50, 'Monica Gabriela Vasconez Acuna', '9300') }, 300)
    setTimeout(() => { if (!ignore) addPaymentNotification(2.75, 'Tania Magaly Suarez Barreiro', '2000') }, 400)
    setTimeout(() => { if (!ignore) addPaymentNotification(3.15, 'Fernando Jose Zhapa Zhapa', '2008') }, 500)

    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab === 'mi-caja' && onNavigate) {
      onNavigate('mi-caja')
    } else if (tab === 'mi-pana' && onNavigate) {
      onNavigate('mi-pana' as Parameters<typeof onNavigate>[0])
    } else if (tab === 'menu' && onNavigate) {
      onNavigate('menu')
    }
  }

  const handleNativeNotificationClick = () => {
    setShowNativeNotifications(false)
    onNavigate?.('mi-pana')
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
      <style>{`
        .home-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .home-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Device shell */}
      <div
        ref={containerRef}
        {...swipeHandlers}
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
          userSelect: 'none',
        }}
      >
        {/* Swipe indicator */}
        {isLongPressed && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, #5B21B6 ${swipeProgress * 100}%, transparent ${swipeProgress * 100}%)`,
              zIndex: 150,
              transition: 'all 0.1s',
            }}
          />
        )}
        {/* Scrollable content */}
        <div
          className="home-scroll"
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
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>¡Hola! {merchantName.split(' ').slice(-1)[0]}</span>
                  <span
                    style={{
                      background: '#EDE9FE',
                      color: '#5B21B6',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 14,
                    }}
                  >
                    Admin
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  {merchantName}
                </p>
              </div>
            </div>
            {/* Right icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* QR Scanner */}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={qrCodeIcon}
                  alt="QR"
                  style={{
                    width: 22,
                    height: 22,
                    objectFit: 'contain',
                    filter: 'brightness(0) saturate(100%) invert(10%) sepia(13%) saturate(938%) hue-rotate(183deg) brightness(95%) contrast(93%)',
                  }}
                />
              </button>
              {/* Bell - Opens App Notifications */}
              <button
                onClick={() => setShowAppNotifications(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <img
                  src={bellIcon}
                  alt="Notificaciones"
                  style={{
                    width: 22,
                    height: 22,
                    objectFit: 'contain',
                    filter: 'brightness(0) saturate(100%) invert(10%) sepia(13%) saturate(938%) hue-rotate(183deg) brightness(95%) contrast(93%)',
                  }}
                />
                {(paymentCount + miPanaCount) > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#ffffff',
                      border: '2px solid #ffffff',
                    }}
                  >
                    {(paymentCount + miPanaCount) > 9 ? '9+' : (paymentCount + miPanaCount)}
                  </div>
                )}
              </button>
              {/* Headphones */}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={headphonesIcon}
                  alt="Soporte"
                  style={{
                    width: 22,
                    height: 22,
                    objectFit: 'contain',
                    filter: 'brightness(0) saturate(100%) invert(10%) sepia(13%) saturate(938%) hue-rotate(183deg) brightness(95%) contrast(93%)',
                  }}
                />
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
            <GestionarContent
              balanceHidden={balanceHidden}
              setBalanceHidden={setBalanceHidden}
              onMiPanaClick={() => onNavigate?.('mi-pana')}
              onSaludClick={() => onNavigate?.('salud')}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />

        {/* Native Phone Notification Dropdown (activated by long press + swipe down) */}
        {showNativeNotifications && (
          <NotificationDropdown
            notifications={notifications}
            onClose={() => setShowNativeNotifications(false)}
            onNotificationClick={handleNativeNotificationClick}
          />
        )}

        {/* App Notifications Screen (activated by bell icon click) */}
        <AppNotifications
          isOpen={showAppNotifications}
          onClose={() => setShowAppNotifications(false)}
          paymentNotifications={paymentNotifications}
          miPanaNotifications={miPanaAppNotifications}
          onMiPanaClick={() => {
            setShowAppNotifications(false)
            onNavigate?.('mi-pana')
          }}
        />
      </div>
    </div>
  )
}
