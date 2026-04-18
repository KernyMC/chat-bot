import { useState, useEffect, useRef, useCallback } from 'react'
import mipanaIcon from '../assets/mipana.svg'

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read?: boolean
  icon?: 'growth' | 'alert' | 'tip' | 'payment'
}

interface NotificationDropdownProps {
  notifications: Notification[]
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getNotificationIcon(icon?: string) {
  switch (icon) {
    case 'growth':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    case 'alert':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    case 'tip':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'payment':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      )
    default:
      return (
        <img
          src={mipanaIcon}
          alt=""
          style={{
            width: 14,
            height: 14,
            filter: 'brightness(0) invert(1)',
          }}
        />
      )
  }
}

// Hook para detectar long press y swipe (funciona con mouse y touch)
export function useSwipeDown(onActivate: () => void, threshold = 100) {
  const [isPressed, setIsPressed] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPressed, setIsLongPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const resetState = useCallback(() => {
    setIsPressed(false)
    setIsLongPressed(false)
    setStartY(0)
    setCurrentY(0)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleStart = useCallback((clientY: number) => {
    // Solo activar si toca en la parte superior (primeros 80px)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const relativeY = clientY - rect.top
      if (relativeY > 80) return
    }

    setStartY(clientY)
    setCurrentY(clientY)
    setIsPressed(true)

    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true)
    }, 300)
  }, [])

  const handleMove = useCallback((clientY: number) => {
    if (!isPressed) return
    setCurrentY(clientY)

    if (isLongPressed && clientY - startY > threshold) {
      onActivate()
      resetState()
    }
  }, [isPressed, isLongPressed, startY, threshold, onActivate, resetState])

  const handleEnd = useCallback(() => {
    resetState()
  }, [resetState])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY)
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLongPressed) {
      e.preventDefault() // Prevent scrolling while swiping
    }
    handleMove(e.touches[0].clientY)
  }, [handleMove, isLongPressed])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // Prevent text selection
    handleStart(e.clientY)
  }, [handleStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPressed) {
      e.preventDefault()
      handleMove(e.clientY)
    }
  }, [isPressed, handleMove])

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const onMouseLeave = useCallback(() => {
    if (isPressed) {
      handleEnd()
    }
  }, [isPressed, handleEnd])

  const swipeProgress = isLongPressed ? Math.min((currentY - startY) / threshold, 1) : 0

  return {
    containerRef,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    isLongPressed,
    swipeProgress,
  }
}

export default function NotificationDropdown({
  notifications,
  onClose,
  onNotificationClick,
}: NotificationDropdownProps) {
  const [animating, setAnimating] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    setTimeout(() => setAnimating(true), 10)
  }, [])

  const handleClose = () => {
    setAnimating(false)
    setTimeout(onClose, 300)
  }

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const diff = e.touches[0].clientY - dragStartY.current
    if (diff < 0) {
      setDragY(diff)
    }
  }

  const handleDragEnd = () => {
    isDragging.current = false
    if (dragY < -80) {
      handleClose()
    } else {
      setDragY(0)
    }
  }

  return (
    <>
      <style>{`
        @keyframes notif-slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes notif-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .notif-backdrop {
          animation: notif-fade-in 0.3s ease-out forwards;
        }
        .notif-container {
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="notif-backdrop"
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          borderRadius: 44,
          opacity: animating ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      />

      {/* Notification panel */}
      <div
        className="notif-container"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          padding: '12px 12px 20px',
          transform: animating ? `translateY(${dragY}px)` : 'translateY(-100%)',
          opacity: animating ? 1 : 0,
        }}
      >
        {/* Status bar simulation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px 12px',
            color: '#ffffff',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 3C7.5 3 3.75 5.5 2 9.25C3.75 13 7.5 15.5 12 15.5C16.5 15.5 20.25 13 22 9.25C20.25 5.5 16.5 3 12 3Z" opacity="0.5" />
              <path d="M1 12L3.5 9.5M3.5 9.5L1 7M3.5 9.5H8" stroke="#fff" strokeWidth="2" fill="none" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M2 17h2v4H2v-4zm4-5h2v9H6v-9zm4-4h2v13h-2V8zm4-3h2v16h-2V5zm4-2h2v18h-2V3z" />
            </svg>
            <div
              style={{
                width: 24,
                height: 12,
                border: '1.5px solid #ffffff',
                borderRadius: 3,
                padding: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '70%', height: '100%', background: '#ffffff', borderRadius: 1 }} />
            </div>
          </div>
        </div>

        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 4,
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Notifications list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.length === 0 ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 15, color: '#6B7280' }}>
                No tienes notificaciones
              </p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div
                key={notif.id}
                onClick={() => onNotificationClick?.(notif)}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 20,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  animation: `notif-slide-down 0.3s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* App icon */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: notif.icon === 'growth'
                          ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                          : notif.icon === 'alert'
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : notif.icon === 'payment'
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getNotificationIcon(notif.icon)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#5B21B6',
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {formatTime(notif.timestamp)}
                  </span>
                </div>

                {/* Message */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#1F2937',
                    lineHeight: 1.45,
                  }}
                >
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Swipe hint */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          Desliza hacia arriba para cerrar
        </p>
      </div>
    </>
  )
}

// Hook para manejar notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (
    title: string,
    message: string,
    icon?: 'growth' | 'alert' | 'tip' | 'payment'
  ) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).slice(2),
      title,
      message,
      timestamp: new Date(),
      read: false,
      icon,
    }
    setNotifications((prev) => [newNotif, ...prev])
    return newNotif
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    markAsRead,
    unreadCount: notifications.filter((n) => !n.read).length,
  }
}
