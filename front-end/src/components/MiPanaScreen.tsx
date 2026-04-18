import { useState } from 'react'
import BottomNavBar, { type NavTab } from './BottomNavBar'

interface MiPanaScreenProps {
  onBack: () => void
}

export default function MiPanaScreen({ onBack }: MiPanaScreenProps) {
  const [navTab, setNavTab] = useState<NavTab>('mi-pana')
  const [message, setMessage] = useState('')

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab !== 'mi-pana') {
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
            borderBottom: '1px solid #F3F4F6',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Chatbot icon */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5B21B6">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L2 22l5.71-.97A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.29 0-2.52-.3-3.61-.85l-.39-.19-3.36.57.57-3.36-.19-.39C4.3 14.52 4 13.29 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>Mi Pana</span>
          </div>
        </div>

        {/* Chat content area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingBottom: 140,
          }}
        >
          {/* Welcome message from bot */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#5B21B6">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L2 22l5.71-.97A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.29 0-2.52-.3-3.61-.85l-.39-.19-3.36.57.57-3.36-.19-.39C4.3 14.52 4 13.29 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <div
              style={{
                background: '#F3F4F6',
                borderRadius: 16,
                borderTopLeftRadius: 4,
                padding: '12px 16px',
                maxWidth: '80%',
              }}
            >
              <p style={{ margin: 0, fontSize: 15, color: '#111827', lineHeight: 1.5 }}>
                Hola Kevin! Soy tu asistente virtual Mi Pana. Estoy aqui para ayudarte con tus
                consultas sobre tu negocio, ventas, y mas. Como puedo ayudarte hoy?
              </p>
            </div>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 48 }}>
            {['Ver mis ventas', 'Cerrar caja', 'Ayuda con cobros', 'Reportes'].map((action) => (
              <button
                key={action}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 20,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#5B21B6',
                  cursor: 'pointer',
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            padding: '12px 20px',
            background: '#ffffff',
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#F9FAFB',
              borderRadius: 24,
              padding: '8px 16px',
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 15,
                color: '#111827',
                outline: 'none',
              }}
            />
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#5B21B6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />
      </div>
    </div>
  )
}
