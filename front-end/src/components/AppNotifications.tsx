import { useState, useEffect } from 'react'
import mipanaIcon from '../assets/mipana.svg'

export interface PaymentNotification {
  id: string
  amount: number
  senderName: string
  accountEnding: string
  timestamp: Date
  type: 'received' | 'sent'
}

export interface MiPanaNotification {
  id: string
  title: string
  message: string
  timestamp: Date
  icon: 'growth' | 'alert' | 'tip' | 'payment'
}

interface AppNotificationsProps {
  isOpen: boolean
  onClose: () => void
  paymentNotifications: PaymentNotification[]
  miPanaNotifications: MiPanaNotification[]
  onMiPanaClick?: () => void
}

function formatTimeCompact(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getMiPanaIcon(icon: string) {
  switch (icon) {
    case 'growth':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    case 'alert':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    case 'tip':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'payment':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      )
    default:
      return (
        <img
          src={mipanaIcon}
          alt=""
          style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }}
        />
      )
  }
}

function getIconBackground(icon: string) {
  switch (icon) {
    case 'growth':
      return 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
    case 'alert':
      return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    case 'payment':
      return 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    default:
      return 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
  }
}

type FilterTab = 'todos' | 'mipana' | 'transferencias'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'mipana', label: 'Mi Pana' },
  { key: 'transferencias', label: 'Transferencias' },
]

export default function AppNotifications({
  isOpen,
  onClose,
  paymentNotifications,
  miPanaNotifications,
  onMiPanaClick,
}: AppNotificationsProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos')

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setTimeout(() => setAnimating(true), 10)
    } else {
      setAnimating(false)
      setTimeout(() => setVisible(false), 300)
    }
  }, [isOpen])

  if (!visible) return null

  const showMiPana = activeFilter === 'todos' || activeFilter === 'mipana'
  const showTransfers = activeFilter === 'todos' || activeFilter === 'transferencias'
  const isEmpty =
    (activeFilter === 'mipana' && miPanaNotifications.length === 0) ||
    (activeFilter === 'transferencias' && paymentNotifications.length === 0) ||
    (activeFilter === 'todos' && miPanaNotifications.length === 0 && paymentNotifications.length === 0)

  return (
    <>
      <style>{`
        .app-notif-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .app-notif-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          transform: animating ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              left: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Notificaciones</span>
        </div>

        {/* Filter chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 16px',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: '1.5px solid #5B21B6',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  background: isActive ? '#5B21B6' : '#EDE9FE',
                  color: isActive ? '#ffffff' : '#5B21B6',
                  transition: 'all 0.18s',
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div
          className="app-notif-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px',
          }}
        >
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p style={{ margin: 0, fontSize: 15 }}>No hay notificaciones</p>
            </div>
          ) : (
            <>
              {/* Mi Pana Section */}
              {showMiPana && miPanaNotifications.length > 0 && (
                <>
                  <h3 style={{ margin: '0 0 10px 4px', fontSize: 14, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Mi Pana
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
                    {miPanaNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={onMiPanaClick}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '14px 4px',
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: getIconBackground(notif.icon),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getMiPanaIcon(notif.icon)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            {notif.title}
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#5B21B6', flexShrink: 0, marginTop: 2 }}>
                          {formatTimeCompact(notif.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Transfers Section */}
              {showTransfers && paymentNotifications.length > 0 && (
                <>
                  <h3 style={{ margin: '0 0 10px 4px', fontSize: 14, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Transferencias
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {paymentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '14px 4px',
                          borderBottom: '1px solid #F3F4F6',
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: '#F0FDF4',
                            border: '1.5px solid #BBF7D0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                            {notif.type === 'received' ? (
                              <path d="M19 5L5 19M5 19V8M5 19h11" />
                            ) : (
                              <path d="M5 19L19 5M19 5v11M19 5H8" />
                            )}
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            {notif.type === 'received' ? 'Recibiste' : 'Enviaste'} ${notif.amount.toFixed(2).replace('.', ',')}
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                            {notif.senderName} · cta. ******{notif.accountEnding}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#9CA3AF' }}>
                            {formatDate(notif.timestamp)}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#5B21B6', flexShrink: 0, marginTop: 2 }}>
                          {formatTimeCompact(notif.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Hook para manejar notificaciones de pagos
export function usePaymentNotifications() {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([])

  const addPaymentNotification = (
    amount: number,
    senderName: string,
    accountEnding: string,
    type: 'received' | 'sent' = 'received'
  ) => {
    const newNotif: PaymentNotification = {
      id: Math.random().toString(36).slice(2),
      amount,
      senderName,
      accountEnding,
      timestamp: new Date(),
      type,
    }
    setNotifications((prev) => [newNotif, ...prev])
    return newNotif
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addPaymentNotification,
    clearAll,
    count: notifications.length,
  }
}

// Hook para manejar notificaciones de Mi Pana (para la app)
export function useMiPanaNotifications() {
  const [notifications, setNotifications] = useState<MiPanaNotification[]>([])

  const addMiPanaNotification = (
    title: string,
    message: string,
    icon: 'growth' | 'alert' | 'tip' | 'payment' = 'tip'
  ) => {
    const newNotif: MiPanaNotification = {
      id: Math.random().toString(36).slice(2),
      title,
      message,
      timestamp: new Date(),
      icon,
    }
    setNotifications((prev) => [newNotif, ...prev])
    return newNotif
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addMiPanaNotification,
    clearAll,
    count: notifications.length,
  }
}
