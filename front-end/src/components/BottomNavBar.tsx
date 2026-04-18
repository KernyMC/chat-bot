import { createElement } from 'react'
import mipanaIcon from '../assets/mipana.svg'

export type NavTab = 'inicio' | 'mi-caja' | 'mi-pana' | 'deuna-veci' | 'menu'

interface BottomNavBarProps {
  activeTab: NavTab
  onTabChange?: (tab: NavTab) => void
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const handleTabClick = (tab: NavTab, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
        paddingTop: 12,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
        }}
      >
        {/* Inicio */}
        <button
          type="button"
          onClick={(e) => handleTabClick('inicio', e)}
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
          {createElement('ion-icon', {
            name: isActive('inicio') ? 'home' : 'home-outline',
            style: { fontSize: 24, color: isActive('inicio') ? '#5B21B6' : '#6B7280' },
          })}
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
          type="button"
          onClick={(e) => handleTabClick('mi-caja', e)}
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
            viewBox="0 0 512 512"
            fill={isActive('mi-caja') ? '#5B21B6' : '#6B7280'}
          >
            <path d="M511.1 378.8l-26.7-160c-2.6-15.4-15.9-26.7-31.6-26.7H208v-64h96c8.8 0 16-7.2 16-16V16c0-8.8-7.2-16-16-16H48c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h96v64H59.1c-15.6 0-29 11.3-31.6 26.7L.8 378.7c-.6 3.5-.9 7-.9 10.5V480c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-90.7c.1-3.5-.2-7-.8-10.5zM280 248c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16zm-32 64h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16zm-32-80c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16zM80 80V48h192v32H80zm40 200h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16zm16 64v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16zm216 112c0 4.4-3.6 8-8 8H168c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v16zm24-112c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16zm48-80c0 8.8-7.2 16-16 16h-16c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16z" />
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

        {/* Mi Pana - Botón central destacado */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: -34,
          }}
        >
          <button
            type="button"
            onClick={(e) => handleTabClick('mi-pana', e)}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#5B21B6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(91, 33, 182, 0.4)',
            }}
          >
            <img
              src={mipanaIcon}
              alt="Mi Pana"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                filter: 'brightness(0) saturate(100%) invert(100%)',
              }}
            />
          </button>
          <span
            style={{
              fontSize: 11,
              fontWeight: isActive('mi-pana') ? 600 : 500,
              color: isActive('mi-pana') ? '#5B21B6' : '#6B7280',
              marginTop: 4,
            }}
          >
            Mi Pana
          </span>
        </div>

        {/* Deuna Veci */}
        <button
          type="button"
          onClick={(e) => handleTabClick('deuna-veci', e)}
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
            {createElement('ion-icon', {
              name: isActive('deuna-veci') ? 'storefront' : 'storefront-outline',
              style: { fontSize: 24, color: isActive('deuna-veci') ? '#5B21B6' : '#6B7280' },
            })}
            {/* Nuevo badge */}
            <div
              style={{
                position: 'absolute',
                top: -6,
                right: -16,
                background: '#A7EED9',
                color: '#5B21B6',
                fontSize: 7,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: 0.2,
                lineHeight: 1.1,
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
          type="button"
          onClick={(e) => handleTabClick('menu', e)}
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
