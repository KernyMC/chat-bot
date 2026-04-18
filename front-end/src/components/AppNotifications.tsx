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

export default function AppNotifications({
  isOpen,
  onClose,
  paymentNotifications,
  miPanaNotifications,
  onMiPanaClick,
}: AppNotificationsProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

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

        {/* Content */}
        <div
          className="app-notif-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 16px',
          }}
        >
          {/* Mi Pana Section */}
          {miPanaNotifications.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 12px 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                Mi Pana
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
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
                    {/* Icon */}
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

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                          {notif.title}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                    </div>

                    {/* Time */}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#5B21B6',
                        flexShrink: 0,
                      }}
                    >
                      {formatTimeCompact(notif.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Historial de Pagos Section */}
          <h3 style={{ margin: '0 0 12px 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Historial
          </h3>

          {paymentNotifications.length === 0 && miPanaNotifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6B7280',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="1.5"
                style={{ marginBottom: 12 }}
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p style={{ margin: 0, fontSize: 15 }}>No tienes notificaciones</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {paymentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '16px 4px',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2.5"
                    >
                      {notif.type === 'received' ? (
                        <path d="M19 5L5 19M5 19V8M5 19h11" />
                      ) : (
                        <path d="M5 19L19 5M19 5v11M19 5H8" />
                      )}
                    </svg>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#22C55E">
                        <rect x="3" y="3" width="18" height="18" rx="3" fill="#22C55E" />
                        <path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                        {notif.type === 'received' ? 'Recibiste' : 'Enviaste'} ${notif.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                      {notif.senderName}, te pagó ${notif.amount.toFixed(2).replace('.', ',')} desde la cta. ******{notif.accountEnding} el {formatDate(notif.timestamp)}.
                    </p>
                  </div>

                  {/* Time */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#5B21B6',
                      flexShrink: 0,
                    }}
                  >
                    {formatTimeCompact(notif.timestamp)}
                  </span>
                </div>
              ))}
            </div>
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
