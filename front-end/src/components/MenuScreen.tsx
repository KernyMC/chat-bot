import { useState } from 'react'
import BottomNavBar, { type NavTab } from './BottomNavBar'

// Menu item component
function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #F3F4F6',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>{label}</span>
    </button>
  )
}

// Section header
function SectionHeader({ title }: { title: string }) {
  return (
    <h3
      style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: '#111827',
        paddingTop: 24,
        paddingBottom: 8,
      }}
    >
      {title}
    </h3>
  )
}

// Icons
const StoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const TeamIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const HeadphonesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#111827">
    <path d="M12 3C7.03 3 3 7.03 3 12v7c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-1c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z" />
  </svg>
)

const DeunaIcon = () => (
  <span
    style={{
      fontWeight: 900,
      fontStyle: 'italic',
      fontSize: 18,
      color: '#111827',
      fontFamily: 'Arial Black, Arial, sans-serif',
    }}
  >
    d!
  </span>
)

const TutorialIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <circle cx="12" cy="10" r="2" />
    <path d="M12 8v-2" />
  </svg>
)

const FAQIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const TermsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

interface MenuScreenProps {
  onBack: () => void
  onLogout?: () => void
}

export default function MenuScreen({ onBack, onLogout }: MenuScreenProps) {
  const [navTab, setNavTab] = useState<NavTab>('menu')

  const handleNavChange = (tab: NavTab) => {
    setNavTab(tab)
    if (tab !== 'menu') {
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

          <span style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>Más opciones</span>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: 100,
          }}
        >
          {/* User profile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 20px 20px 20px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#5B21B6">
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Kevin Alexander</span>
                <span
                  style={{
                    background: '#0F766E',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 12,
                  }}
                >
                  Administrador
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                Vargas Paladines Kevin...
              </p>
            </div>
          </div>

          {/* Menu content */}
          <div style={{ padding: '0 20px' }}>
            {/* Mi Negocio section */}
            <SectionHeader title="Mi Negocio" />
            <MenuItem icon={<StoreIcon />} label="Perfil de negocio" />
            <MenuItem icon={<TeamIcon />} label="Equipo y Roles" />

            {/* Configuraciones section */}
            <SectionHeader title="Configuraciones" />
            <MenuItem icon={<DollarIcon />} label="Límites de cuenta" />
            <MenuItem icon={<LockIcon />} label="Clave de seguridad" />

            {/* Soporte y Ayuda section */}
            <SectionHeader title="Soporte y Ayuda" />
            <MenuItem icon={<HeadphonesIcon />} label="Soporte" />
            <MenuItem icon={<DeunaIcon />} label="Solicita material publicitario" />
            <MenuItem icon={<TutorialIcon />} label="Tutoriales" />
            <MenuItem icon={<FAQIcon />} label="Preguntas Frecuentes" />
            <MenuItem icon={<TermsIcon />} label="Términos y condiciones" />
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px 20px 20px',
              gap: 8,
            }}
          >
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                color: '#5B21B6',
                textDecoration: 'underline',
                padding: 8,
              }}
            >
              Cerrar sesión
            </button>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
              Última sesión: 17 Apr 2026 | 10:32 pm
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>versión 1.0.93.193</p>

            {/* Deuna logo */}
            <div style={{ marginTop: 8 }}>
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                <path
                  d="M8 4C8 2.89543 8.89543 2 10 2H22C23.1046 2 24 2.89543 24 4V20C24 21.1046 23.1046 22 22 22H10C8.89543 22 8 21.1046 8 20V4Z"
                  fill="#E5E7EB"
                />
                <text
                  x="16"
                  y="15"
                  textAnchor="middle"
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fill: '#9CA3AF',
                    fontFamily: 'Arial Black, Arial, sans-serif',
                  }}
                >
                  d!
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar activeTab={navTab} onTabChange={handleNavChange} />
      </div>
    </div>
  )
}
