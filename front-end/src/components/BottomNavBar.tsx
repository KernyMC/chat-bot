export type NavTab = 'inicio' | 'mi-caja' | 'mi-pana' | 'deuna-veci' | 'menu'

interface BottomNavBarProps {
  activeTab: NavTab
  onTabChange?: (tab: NavTab) => void
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const handleTabClick = (tab: NavTab) => {
    onTabChange?.(tab)
  }

  const isActive = (tab: NavTab) => activeTab === tab

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #F3F4F6',
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
        }}
      >
        {/* Inicio */}
        <button
          onClick={() => handleTabClick('inicio')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isActive('inicio') ? '#5B21B6' : 'none'}
            stroke={isActive('inicio') ? '#5B21B6' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('inicio') ? 600 : 500,
              color: isActive('inicio') ? '#5B21B6' : '#6B7280',
            }}
          >
            Inicio
          </span>
        </button>

        {/* Mi Caja */}
        <button
          onClick={() => handleTabClick('mi-caja')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isActive('mi-caja') ? '#5B21B6' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 14h4" />
            <path d="M6 17h2" />
            <rect x="14" y="13" width="6" height="5" rx="1" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('mi-caja') ? 600 : 500,
              color: isActive('mi-caja') ? '#5B21B6' : '#6B7280',
            }}
          >
            Mi Caja
          </span>
        </button>

        {/* Mi Pana */}
        <button
          onClick={() => handleTabClick('mi-pana')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isActive('mi-pana') ? '#5B21B6' : 'none'}
            stroke={isActive('mi-pana') ? '#5B21B6' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('mi-pana') ? 600 : 500,
              color: isActive('mi-pana') ? '#5B21B6' : '#6B7280',
            }}
          >
            Mi Pana
          </span>
        </button>

        {/* Deuna Veci */}
        <button
          onClick={() => handleTabClick('deuna-veci')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: 56,
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive('deuna-veci') ? '#5B21B6' : '#6B7280'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3z" />
              <path d="M18 18h3v3h-3z" />
              <path d="M14 18h1" />
              <path d="M18 14h1" />
            </svg>
            {/* Nuevo badge */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -16,
                background: '#0F766E',
                color: '#ffffff',
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 5px',
                borderRadius: 4,
                letterSpacing: 0.2,
              }}
            >
              Nuevo
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('deuna-veci') ? 600 : 500,
              color: isActive('deuna-veci') ? '#5B21B6' : '#6B7280',
              marginTop: 2,
            }}
          >
            Deuna Veci
          </span>
        </button>

        {/* Menu */}
        <button
          onClick={() => handleTabClick('menu')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: 56,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isActive('menu') ? '#5B21B6' : '#6B7280'}
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('menu') ? 600 : 500,
              color: isActive('menu') ? '#5B21B6' : '#6B7280',
            }}
          >
            Menu
          </span>
        </button>
      </div>

      {/* Home indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <div style={{ width: 120, height: 4, background: '#D1D5DB', borderRadius: 4 }} />
      </div>
    </div>
  )
}
